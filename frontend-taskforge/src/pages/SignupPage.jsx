import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../services/api";

const SignupPage = () => {
	const navigate = useNavigate();
	const [form, setForm] = useState({ name: "", email: "", password: "" });
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleChange = ({ target }) => {
		setForm((current) => ({ ...current, [target.name]: target.value }));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");
		setSuccess("");
		setIsSubmitting(true);

		try {
			const response = await authApi.signup(form);
			setSuccess(response.message || "Account created successfully.");
			setTimeout(() => navigate("/login"), 800);
		} catch (requestError) {
			setError(requestError.message || "Unable to create your account.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return <section className="auth-page"><form className="auth-card" onSubmit={handleSubmit}>
		<h1>Create your account</h1>
		<p>Start organizing work with TaskForge.</p>
		{error && <p className="form-error" role="alert">{error}</p>}
		{success && <p className="form-success" role="status">{success}</p>}
		<label>Name<input name="name" type="text" placeholder="Your name" value={form.name} onChange={handleChange} required /></label>
		<label>Email<input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required /></label>
		<label>Password<input name="password" type="password" placeholder="At least 8 characters" value={form.password} onChange={handleChange} minLength={8} required /></label>
		<button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating account..." : "Create account"}</button>
		<p>Already have an account? <Link to="/login">Sign in</Link></p>
	</form></section>;
};

export default SignupPage;
