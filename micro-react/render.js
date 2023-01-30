export function render(element, container) {
	// 创建父节点
	const dom =
		element.type == "TEXT_ELEMENT"
			? document.createTextNode("")
			: document.createElement(element.type);

	// 赋值属性
	Object.keys(element.props)
		.filter(key => key !== "children")
		.forEach(key => (dom[key] = element.props[key]));

	// 将子节点添加到父节点下
	container.append(dom);
}

let nextUnitOfWork = null;

// 调度函数
function workLoop(deadline) {
	// 是否退出
	let shouldYield = false;

	while (nextUnitOfWork && !shouldYield) {
		nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
		shouldYield = deadline.timeRemaining() < 1;
	}

	// 没有剩余时间，退出循环。将工作交给 requestIdleCallback 调度
	requestIdleCallback(workLoop);
}

// 第一次请求
requestIdleCallback(workLoop);

function performUnitOfWork(nextUnitOfWork) {
	// TODO
}
