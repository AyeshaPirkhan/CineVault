export default function Loader({ text = "Loading movies..." }) {
  return <div className="loader"><span></span><p>{text}</p></div>;
}
