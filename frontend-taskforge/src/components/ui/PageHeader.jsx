const PageHeader = ({ title, description, action }) => (
  <header className="page-header">
    <div>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
    {action}
  </header>
);

export default PageHeader;
