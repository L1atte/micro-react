## Concurrent Mode

There’s a problem with this recursive call.

Once we start rendering, we won’t stop until we have rendered the complete element tree. If the element tree is big, it may block the main thread for too long. And if the browser needs to do high priority stuff like handling user input or keeping an animation smooth, it will have to wait until the render finishes.

## Fiber structure

```typescript
type Fiber = {
    // Tag identifying the type of fiber.
    tag: TypeOfWork,
 
    // Unique identifier of this child.
    key: null | string,
 
    // The value of element.type which is used to preserve the identity during
    // reconciliation of this child.
    elementType: any,
 
    // The resolved function/class/ associated with this fiber.
    type: any,
 
    // The local state associated with this fiber.
    stateNode: any,
 
    // Remaining fields belong to Fiber
 
    // The Fiber to return to after finishing processing this one.
    // This is effectively the parent.
    // It is conceptually the same as the return address of a stack frame.
    return: Fiber | null,
 
    // Singly Linked List Tree Structure.
    child: Fiber | null,
    sibling: Fiber | null,
    index: number,
 
    // The ref last used to attach this node.
    ref: null | (((handle: mixed) => void) & {_stringRef: ?string, ...}) | RefObject,
 
    // Input is the data coming into process this fiber. Arguments. Props.
    pendingProps: any, // This type will be more specific once we overload the tag.
    memoizedProps: any, // The props used to create the output.
 
    // A queue of state updates and callbacks.
    updateQueue: mixed,
 
    // The state used to create the output
    memoizedState: any,
 
    mode: TypeOfMode,
 
    // Effect
    effectTag: SideEffectTag,
    subtreeTag: SubtreeTag,
    deletions: Array<Fiber> | null,
 
    // Singly linked list fast path to the next fiber with side-effects.
    nextEffect: Fiber | null,
 
    // The first and last fiber with side-effect within this subtree. This allows
    // us to reuse a slice of the linked list when we reuse the work done within
    // this fiber.
    firstEffect: Fiber | null,
    lastEffect: Fiber | null,
 
    // This is a pooled version of a Fiber. Every fiber that gets updated will
    // eventually have a pair. There are cases when we can clean up pairs to save
    // memory if we need to.
    alternate: Fiber | null,
  };
```

