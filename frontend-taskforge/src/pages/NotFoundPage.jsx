import { Link } from "react-router-dom";

const NotFoundPage = () => <section className="auth-page"><div className="auth-card"><h1>Page not found</h1><p>The page you requested does not exist.</p><Link to="/dashboard">Go to dashboard</Link></div></section>;

export default NotFoundPage;
