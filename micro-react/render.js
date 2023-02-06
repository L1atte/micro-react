function createDom(fiber) {
	// 创建父节点
	const dom = fiber.type == "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(fiber.type);

	// 赋值属性
	Object.keys(fiber.props)
		.filter(key => key !== "children")
		.forEach(key => (dom[key] = fiber.props[key]));

	return dom;
}

// 开始渲染
// render 接收 createElement() 创建的 js 对象
function render(element, container) {
	// root 节点的 fiber，称之为 work in progress
	wipRoot = {
		dom: container,
		props: {
			children: [element],
		},
		parent: null,
		child: null,
		sibling: null,
		alternate: currentRoot,
	};
	deletions = [];
	// set next unit of work
	nextUnitOfWork = wipRoot;
}

// 渲染 Root
// Commit Phase
function commitRoot() {
	deletions.forEach(item => commitWork(item));
	commitWork(wipRoot.child);
	// commit完成后，把wipRoot变为currentRoot
	currentRoot = wipRoot;
	wipRoot = null;
}

function commitWork(fiber) {
	if (!fiber) {
		return;
	}

	// 由于函数式组件没有 dom 的原因，所以需要不断向上遍历找到含有 dom 的 fiber
	let domParentFiber = fiber.parent;
	while (!domParentFiber.dom) {
		domParentFiber = domParentFiber.parent;
	}
	const domParent = domParentFiber.dom;

	if (fiber.dom && fiber.effectTag === "PLACEMENT") {
		domParent.append(fiber.dom);
	} else if (fiber.dom && fiber.effectTag === "DELETION") {
		commitDeletion(fiber, domParent);
	} else if (fiber.dom && fiber.effectTag === "UPDATE") {
		updateDom(fiber.dom, fiber.alternate.props, fiber.props);
	}

	commitWork(fiber.child);
	commitWork(fiber.sibling);
}

function commitDeletion(fiber, domParent) {
	if (fiber.dom) {
		domParent.removeChild(fiber.dom);
	} else {
		commitDeletion(fiber.child, domParent);
	}
}

function updateDom(dom, prevProps, nextProps) {
	const isEvent = key => key.startsWith("on");
	// 删除已经没有的props
	Object.keys(prevProps)
		.filter(key => key != "children" && !isEvent(key))
		// 不在nextProps中
		.filter(key => !key in nextProps)
		.forEach(key => {
			// 清空属性
			dom[key] = "";
		});

	// 添加新增的属性/修改变化的属性
	Object.keys(nextProps)
		.filter(key => key !== "children" && !isEvent(key))
		// 不再prevProps中
		.filter(key => !key in prevProps || prevProps[key] !== nextProps[key])
		.forEach(key => {
			dom[key] = nextProps[key];
		});

	// 删除事件处理函数
	Object.keys(prevProps)
		.filter(isEvent)
		// 新的属性没有，或者有变化
		.filter(key => !key in nextProps || prevProps[key] !== nextProps[key])
		.forEach(key => {
			const eventType = key.toLowerCase().substring(2);
			dom.removeEventListener(eventType, prevProps[key]);
		});

	// 添加新的事件处理函数
	Object.keys(nextProps)
		.filter(isEvent)
		.filter(key => prevProps[key] !== nextProps[key])
		.forEach(key => {
			const eventType = key.toLowerCase().substring(2);
			dom.addEventListener(eventType, nextProps[key]);
		});
}

let nextUnitOfWork = null;
// 正在进行的渲染
let wipRoot = null;
// 上次渲染
let currentRoot = null;
// 要删除的fiber
let deletions = null;

// 调度函数
function workLoop(deadline) {
	// shouldYield 表示线程繁忙，应该中断渲染
	let shouldYield = false;

	while (nextUnitOfWork && !shouldYield) {
		nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
		shouldYield = deadline.timeRemaining() < 1;
	}

	// 如果没有 nextUnitOfWork ，则进入 Commit 阶段
	if (!nextUnitOfWork && wipRoot) {
		commitRoot();
	}

	// 没有剩余时间，退出循环。将工作交给 requestIdleCallback 调度
	requestIdleCallback(workLoop);
}

// 第一次请求
requestIdleCallback(workLoop);

// 执行一个渲染任务单元，并返回新的任务
function performUnitOfWork(fiber) {
	const isFunctionComponent = fiber.type instanceof Function;
	if (isFunctionComponent) updateFunctionComponent(fiber);
	else updateHostComponent(fiber);

	if (fiber.child) {
		return fiber.child;
	}
	let nextFiber = fiber;
	while (nextFiber) {
		if (nextFiber.sibling) {
			return nextFiber.sibling;
		}
		nextFiber = nextFiber.parent;
	}
}

function updateFunctionComponent(fiber) {
	// 这里 fiber.type 是一个函数
	const children = [fiber.type(fiber.props)];

	// 新建 newFiber，构建 fiber tree
	reconcileChildren(fiber, children);
}

function updateHostComponent(fiber) {
	// add dom node
	if (!fiber.dom) fiber.dom = createDom(fiber);

	// 新建 newFiber，构建 fiber tree
	reconcileChildren(fiber, fiber.props.children);
}

// 同时迭代旧的 fiber（即 wipFiber.alternate）和新 elements（即我们希望渲染到 dom 的元素）
// elements 此时还不是 Fiber 结构
function reconcileChildren(wipFiber, elements) {
	let index = 0;
	let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
	let prevSibling = null;

	while (index < elements.length || oldFiber != null) {
		const element = elements[index];
		let newFiber = null;

		const sameType = oldFiber && element && oldFiber.type === element.type;

		// 更新
		// 保持旧 dom 节点引用，然后通过 props 更新
		if (sameType) {
			newFiber = {
				type: oldFiber.type,
				props: element.props,
				dom: oldFiber.dom, // 保持旧 dom 引用
				parent: wipFiber,
				child: null,
				sibling: null,
				alternate: oldFiber,
				effectTag: "UPDATE",
			};
		}

		// 创建
		if (element && !sameType) {
			newFiber = {
				type: element.type,
				props: element.props,
				dom: null,
				parent: wipFiber,
				child: null,
				sibling: null,
				alternate: null,
				effectTag: "PLACEMENT",
			};
		}

		// 删除
		if (oldFiber && !sameType) {
			oldFiber.effectTag = "DELETION";
			deletions.push(oldFiber);
		}

		// 遍历 fiber
		// 因为 fiber 只有一个 child 节点，其余 child 节点被视作 child 节点的 sibling 节点。
		// 因此这样遍历
		if (oldFiber) oldFiber = oldFiber.sibling;

		// 第一个child才可以作为child，其他的就是sibling
		if (index === 0) {
			wipFiber.child = newFiber;
		} else {
			prevSibling.sibling = newFiber;
		}

		prevSibling = newFiber;
		index++;
	}
}

export { render };
