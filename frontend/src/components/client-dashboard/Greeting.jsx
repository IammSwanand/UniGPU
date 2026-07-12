/**
 * Greeting — time-of-day salutation + welcome line.
 *
 * Per docs/client-db-content.md § Greeting:
 *   Morning   → "Good Morning, {{first_name}}"
 *   Afternoon → "Good Afternoon, {{first_name}}"
 *   Evening   → "Good Evening, {{first_name}}"
 * with the welcome subtext "Your compute workspace is ready."
 */
function greetingPrefix() {
  // const h = new Date().getHours();
  // if (h < 12) return 'Good Morning';
  // if (h < 17) return 'Good Afternoon';
  // return 'Good Evening';
  return 'Greetings'
}

function firstName(user) {
  const raw = user?.username || user?.email || 'there';
  return raw.split(/[\s@._-]+/)[0] || 'there';
}

export default function Greeting({ user }) {
  return (
    <header className="cd-greeting">
      <h1 className="cd-greeting__hello">
        {greetingPrefix()}, {firstName(user)}
      </h1>
      <p className="cd-greeting__sub">Ready to run your next workload?</p>
    </header>
  );
}
