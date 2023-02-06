import { Didact } from "./micro-react/index.js";
const { createElement, render } = Didact;

function App(props) {
	return createElement("h1", null, "Hi", props.name);
}

const element = createElement(App, {
	name: "foo",
});
const container = document.getElementById("root");
render(element, container);
