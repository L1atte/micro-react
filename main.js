import { Didact } from "./micro-react/index.js";

const { createElement, render } = Didact;
const element = createElement(
	"h1",
	{ id: "title" },
	"Hello React",
	createElement("a", { href: "https://bilibili.com" }, "Click Me!")
);

const container = document.querySelector("#root");

render(element, container);
