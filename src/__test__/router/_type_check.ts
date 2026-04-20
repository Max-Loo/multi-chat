// Temporary type check file
import router from '@/router/index';
import type { RouteObject, NonIndexRouteObject } from 'react-router-dom';

// RouteObject has element, children, path, index - all the properties we need
// But Router.routes returns AgnosticDataRouteObject[] which doesn't have element

// Option 1: Cast root route to NonIndexRouteObject (has children + element)
const rootRoute = router.routes[0] as NonIndexRouteObject;
const children = rootRoute.children;
const elem = rootRoute.element;
const p = rootRoute.path;
void children; void elem; void p;

// Can we iterate children?
children?.forEach((route: RouteObject) => {
  const rp = route.path;
  const re = route.element;
  const rc = route.children;
  void rp; void re; void rc;
});

// Can we access element.type.name? (React element internals)
// ReactNode doesn't have .type - need React.ReactElement
import type { ReactElement } from 'react';
const chatRoute = children?.find(r => r.path === 'chat');
const chatElem = chatRoute?.element as ReactElement | undefined;
const chatType = chatElem?.type;
void chatType;
