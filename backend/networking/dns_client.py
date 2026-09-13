import time
import uuid
import socket
import ipaddress
from backend.networking.events import ProtocolEvent
from dataclasses import asdict

async def resolve_dns(hostname: str) -> list[dict]:
    events = []
    start_time = time.time()
    txn_id = uuid.uuid4().hex[:4].upper()

    # Clean hostname (remove port if attached)
    if ":" in hostname and not hostname.startswith("["):
        hostname = hostname.split(":")[0]

    def is_ip(addr: str) -> bool:
        try:
            ipaddress.ip_address(addr)
            return True
        except ValueError:
            return False

    # If it's already an IP address, DNS resolution is not needed
    if is_ip(hostname):
        event = ProtocolEvent(
            id=f"dns-{txn_id}-info",
            protocol="DNS",
            direction="client→server",
            summary=f"DNS query bypassed ({hostname} is direct IP literal)",
            raw=f";; Direct IP address provided: {hostname}\n;; Skipping DNS query",
            keyFields=[{"label": "Host", "value": hostname}, {"label": "Note", "value": "IP Literal"}],
            offsetMs=0.0,
            status="real"
        )
        return [asdict(event)]

    query_event = ProtocolEvent(
        id=f"dns-{txn_id}-query",
        protocol="DNS",
        direction="client→server",
        summary=f"DNS A? {hostname}",
        raw=(
            f";; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 0x{txn_id}\n"
            f";; flags: rd; QUERY: 1, ANSWER: 0, AUTHORITY: 0, ADDITIONAL: 0\n\n"
            f";; QUESTION SECTION:\n"
            f";{hostname}.                    IN      A"
        ),
        keyFields=[{"label": "Type", "value": "A (Host Address)"}, {"label": "Name", "value": hostname}],
        offsetMs=0.0,
        status="real"
    )
    events.append(asdict(query_event))

    try:
        # Try dnspython first for detailed DNS attributes
        import dns.resolver
        resolver = dns.resolver.Resolver()
        resolver.timeout = 5.0
        resolver.lifetime = 5.0
        server = resolver.nameservers[0] if resolver.nameservers else "8.8.8.8"
        answer = resolver.resolve(hostname, 'A')
        elapsed_ms = round((time.time() - start_time) * 1000, 1)

        ips = [rdata.to_text() for rdata in answer]
        ttl = answer.rrset.ttl if answer.rrset else 300

        raw_ans = (
            f";; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 0x{txn_id}\n"
            f";; flags: qr rd ra; QUERY: 1, ANSWER: {len(ips)}, AUTHORITY: 0, ADDITIONAL: 0\n\n"
            f";; QUESTION SECTION:\n"
            f";{hostname}.                    IN      A\n\n"
            f";; ANSWER SECTION:\n"
        )
        for ip in ips:
            raw_ans += f"{hostname}.              {ttl}     IN      A       {ip}\n"
        raw_ans += f"\n;; Query time: {int(elapsed_ms)} msec\n;; SERVER: {server}#53({server}) (UDP)"

        key_fields = [
            {"label": "Status", "value": "NOERROR"},
            {"label": "Resolved IP", "value": ips[0] if ips else "None"},
            {"label": "TTL", "value": f"{ttl}s"},
            {"label": "Server", "value": str(server)},
        ]

        resp_event = ProtocolEvent(
            id=f"dns-{txn_id}-resp",
            protocol="DNS",
            direction="server→client",
            summary=f"DNS {hostname} → {ips[0] if ips else 'None'} (TTL {ttl}s)",
            raw=raw_ans,
            keyFields=key_fields,
            offsetMs=elapsed_ms,
            status="real"
        )
        events.append(asdict(resp_event))

    except Exception as dns_err:
        # Fallback to standard library socket if dnspython fails or throws
        try:
            addrinfo = socket.getaddrinfo(hostname, 80, socket.AF_INET, socket.SOCK_STREAM)
            elapsed_ms = round((time.time() - start_time) * 1000, 1)
            ips = list(set([item[4][0] for item in addrinfo]))

            raw_ans = (
                f";; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 0x{txn_id}\n"
                f";; flags: qr rd ra; QUERY: 1, ANSWER: {len(ips)}\n\n"
                f";; ANSWER SECTION:\n"
            )
            for ip in ips:
                raw_ans += f"{hostname}.              300     IN      A       {ip}\n"
            raw_ans += f"\n;; Query time: {int(elapsed_ms)} msec\n;; System resolver"

            resp_event = ProtocolEvent(
                id=f"dns-{txn_id}-resp",
                protocol="DNS",
                direction="server→client",
                summary=f"DNS {hostname} → {ips[0]} (System Resolved)",
                raw=raw_ans,
                keyFields=[
                    {"label": "Status", "value": "NOERROR"},
                    {"label": "Resolved IP", "value": ips[0]},
                    {"label": "Resolver", "value": "OS System Resolver"},
                ],
                offsetMs=elapsed_ms,
                status="real"
            )
            events.append(asdict(resp_event))
        except Exception as sock_err:
            elapsed_ms = round((time.time() - start_time) * 1000, 1)
            error_msg = str(dns_err) or str(sock_err)
            resp_event = ProtocolEvent(
                id=f"dns-{txn_id}-err",
                protocol="DNS",
                direction="server→client",
                summary=f"DNS resolution failed: {hostname}",
                raw=f";; DNS Query Failed\n;; Domain: {hostname}\n;; Error: {error_msg}\n;; Query time: {int(elapsed_ms)} msec",
                keyFields=[{"label": "Status", "value": "NXDOMAIN / Error"}, {"label": "Error", "value": error_msg}],
                offsetMs=elapsed_ms,
                status="real"
            )
            events.append(asdict(resp_event))

    return events
