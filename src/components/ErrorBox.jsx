export default function ErrorBox({ message }) {
  return (
    <div className="error-box">
      <strong>Something went wrong</strong>
      <p>{message}</p>
    </div>
  );
}
