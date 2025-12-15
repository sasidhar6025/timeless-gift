import { useState } from "react";

export default function HoverImage({ name, image }) {
  const [show, setShow] = useState(false);

  return (
    <span
      className="hover-name"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {name}
      {show && <img src={image} className="hover-image" />}
    </span>
  );
}
