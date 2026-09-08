import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../services/api";

const LoginPage = () => {
	const navigate = useNavigate();
	const [form, setForm] = useState({ email: "", password: "" });
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleChange = ({ target }) => {
		setForm((current) => ({ ...current, [target.name]: target.value }));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");
		setIsSubmitting(true);

		try {
			await authApi.login(form);
			navigate("/dashboard");
		} catch (requestError) {
			setError(requestError.message || "Unable to sign in.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return <section className="auth-page"><form className="auth-card" onSubmit={handleSubmit}>
		<h1>Welcome back</h1>
		<p>Sign in to TaskForge.</p>
		{error && <p className="form-error" role="alert">{error}</p>}
		<label>Email<input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} autoComplete="email" required /></label>
		<label>Password<input name="password" type="password" placeholder="Your password" value={form.password} onChange={handleChange} autoComplete="current-password" required /></label>
		<button type="submit" disabled={isSubmitting}>{isSubmitting ? "Signing in..." : "Sign in"}</button>
		<p>New here? <Link to="/signup">Create an account</Link></p>
	</form></section>;
};

export default LoginPage;
