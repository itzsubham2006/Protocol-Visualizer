"""
Local SMTP Test Server for Protocol Visualizer
Runs on 127.0.0.1:2525 — accepts SMTP connections without forwarding email externally.
Used for demonstrating real TCP SMTP conversations safely.

Usage:
    python backend/smtp_server.py
"""

import asyncio
import uuid
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [SMTP-Server] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("smtp_server")


async def handle_smtp_client(reader, writer):
    addr = writer.get_extra_info('peername')
    logger.info(f"New connection from {addr}")

    async def send_line(msg: str):
        logger.info(f"  S: {msg}")
        writer.write((msg + "\r\n").encode())
        await writer.drain()

    # Send server greeting
    await send_line("220 localhost ESMTP Protocol-Visualizer-TestServer ready")

    receiving_data = False
    data_buffer = b""

    while True:
        try:
            if receiving_data:
                # Read email data until we see \r\n.\r\n
                chunk = await asyncio.wait_for(reader.read(4096), timeout=30)
                if not chunk:
                    break
                data_buffer += chunk
                if b"\r\n.\r\n" in data_buffer:
                    # Extract the message content (everything before the terminator)
                    msg_end = data_buffer.index(b"\r\n.\r\n")
                    email_content = data_buffer[:msg_end].decode(errors="replace")
                    logger.info(f"  Received email data ({len(email_content)} bytes):")
                    for line in email_content.split("\r\n")[:10]:
                        logger.info(f"    | {line}")
                    if email_content.count("\r\n") > 10:
                        logger.info(f"    | ... ({email_content.count(chr(10))} total lines)")

                    queue_id = uuid.uuid4().hex[:10].upper()
                    await send_line(f"250 2.0.0 Ok: queued as {queue_id}")
                    receiving_data = False
                    data_buffer = b""
                continue

            # Read a command line
            raw_line = await asyncio.wait_for(reader.readline(), timeout=30)
            if not raw_line:
                break

            line = raw_line.decode(errors="replace").strip()
            if not line:
                continue

            logger.info(f"  C: {line}")
            cmd = line.split()[0].upper() if line.split() else ""

            if cmd == "EHLO" or cmd == "HELO":
                await send_line("250-localhost Hello")
                await send_line("250-SIZE 10485760")
                await send_line("250-8BITMIME")
                await send_line("250-ENHANCEDSTATUSCODES")
                await send_line("250 HELP")
            elif cmd == "MAIL":
                await send_line("250 2.1.0 Ok")
            elif cmd == "RCPT":
                await send_line("250 2.1.5 Ok")
            elif cmd == "DATA":
                await send_line("354 End data with <CR><LF>.<CR><LF>")
                receiving_data = True
                data_buffer = b""
            elif cmd == "QUIT":
                await send_line("221 2.0.0 Bye")
                break
            elif cmd == "NOOP":
                await send_line("250 2.0.0 Ok")
            elif cmd == "RSET":
                await send_line("250 2.0.0 Ok")
            else:
                await send_line(f"500 5.5.1 Command unrecognized: {cmd}")

        except asyncio.TimeoutError:
            logger.info(f"  Connection timed out for {addr}")
            break
        except asyncio.IncompleteReadError:
            logger.info(f"  Connection closed by client {addr}")
            break
        except Exception as e:
            logger.error(f"  Error handling {addr}: {e}")
            break

    try:
        writer.close()
        await writer.wait_closed()
    except Exception:
        pass
    logger.info(f"Connection closed for {addr}")


async def main():
    server = await asyncio.start_server(
        handle_smtp_client, '127.0.0.1', 2525
    )
    addr = server.sockets[0].getsockname()
    print(f"\n{'='*60}")
    print(f"  Protocol Visualizer — Local SMTP Test Server")
    print(f"  Listening on {addr[0]}:{addr[1]}")
    print(f"  This server does NOT deliver emails externally.")
    print(f"  Press Ctrl+C to stop.")
    print(f"{'='*60}\n")
    logger.info(f"SMTP test server started on {addr[0]}:{addr[1]}")

    async with server:
        await server.serve_forever()


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nSMTP server stopped.")
