import { useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { buildMailSequence } from '../../protocols/sequenceBuilders';

export default function MailForm() {
  const [to, setTo] = useState('recipient@example.com');
  const [subject, setSubject] = useState('Hello from Protocol Visualizer');
  const [body, setBody] = useState('This is a test email to demonstrate the SMTP protocol conversation flow.\n\nBest regards,\nProtocol Visualizer');
  const { startActivity, isPlaying } = useSession();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!to.trim() || !subject.trim()) return;

    const steps = buildMailSequence({
      to: to.trim(),
      subject: subject.trim(),
      body: body.trim(),
    });
    startActivity('mail', steps, `Sending email to ${to.trim()}`);
  };

  return (
    <form onSubmit={handleSubmit} id="mail-form">
      <div className="form-group">
        <label className="form-label" htmlFor="mail-to">Recipient Address</label>
        <input
          type="email"
          id="mail-to"
          className="form-input"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="recipient@example.com"
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="mail-subject">Subject</label>
        <input
          type="text"
          id="mail-subject"
          className="form-input"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject"
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="mail-body">Message Body</label>
        <textarea
          id="mail-body"
          className="form-textarea"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your message..."
          rows={3}
        />
      </div>
      <button
        type="submit"
        className="btn-primary-action"
        id="mail-submit"
        disabled={!to.trim() || !subject.trim()}
      >
        <span>{isPlaying ? 'Restart Send' : 'Send Email →'}</span>
      </button>
    </form>
  );
}
