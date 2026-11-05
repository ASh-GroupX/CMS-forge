import { resolve } from 'node:path';
export const navigationTestAdapters = {
  name: 'navigation-test-adapters', setup(builder) {
    builder.onResolve({ filter: /^next\/navigation$/ }, args => ({ path: args.path, namespace: 'navigation-test' }));
    builder.onLoad({ filter: /.*/, namespace: 'navigation-test' }, () => ({ loader: 'js', resolveDir: resolve('apps/web'), contents: `
      import React from 'react';
      const subscribe=callback=>{window.addEventListener('popstate',callback);window.addEventListener('cms:test-route',callback);return()=>{window.removeEventListener('popstate',callback);window.removeEventListener('cms:test-route',callback);}};
      export const __router={push(href){history.pushState({},'',href);window.dispatchEvent(new Event('cms:test-route'));window.scrollTo(0,0);},replace(href){history.replaceState({},'',href);window.dispatchEvent(new Event('cms:test-route'));},back(){history.back();},forward(){history.forward();},refresh(){},prefetch(){}};
      export const useRouter=()=>__router;
      export const usePathname=()=>React.useSyncExternalStore(subscribe,()=>location.pathname,()=>window.__NAV_INITIAL_PATH.split('?')[0]);
      export const useSearchParams=()=>new URLSearchParams(React.useSyncExternalStore(subscribe,()=>location.search,()=>window.__NAV_INITIAL_PATH.includes('?')?'?'+window.__NAV_INITIAL_PATH.split('?')[1]:''));
    ` }));
    builder.onResolve({ filter: /^next\/link$/ }, args => ({ path: args.path, namespace: 'link-test' }));
    builder.onLoad({ filter: /.*/, namespace: 'link-test' }, () => ({ loader: 'js', resolveDir: resolve('apps/web'), contents: `
      import React from 'react';import {__router} from 'next/navigation';
      export default function Link({href,onClick,children,...props}){return React.createElement('a',{...props,href,onClick(event){onClick?.(event);if(!event.defaultPrevented&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&(!props.target||props.target==='_self')){event.preventDefault();__router.push(href);}}},children);}
    ` }));
    builder.onResolve({ filter: /staff-internal-tickets-actions$/ }, args => ({ path: args.path, namespace: 'ticket-actions-test' }));
    builder.onLoad({ filter: /.*/, namespace: 'ticket-actions-test' }, () => ({ loader: 'js', contents: `
      export async function getDepartmentFormFields(departmentId){await new Promise(resolve=>setTimeout(resolve,200));return {config:{enablePriorityField:true,enableDueDateField:true,enableAttachmentsField:true,enableOfficerSelection:true},customFields:[{id:'customer-phone',departmentId,nameEn:'Customer phone',nameAr:'هاتف العميل',fieldType:'TEXT',isRequired:true,isActive:true,phoneDuplicateCheck:true,options:[],order:0}]};}
      export async function createInternalTicket(data){window.createdTicket=data;return {success:true,data:{id:'created-ticket'}};}
      export async function addTicketNote(id,content){window.followUpNote={id,content};return {success:true};}
    ` }));
    builder.onResolve({ filter: /staff-ticket-phone-actions$/ }, args => ({ path: args.path, namespace: 'phone-actions-test' }));
    builder.onLoad({ filter: /.*/, namespace: 'phone-actions-test' }, () => ({ loader: 'js', contents: `export async function findTicketPhoneDuplicates(){return {items:[{id:'existing',referenceNumber:'TKT-100',title:'Existing problem',status:'IN_PROGRESS'}]};}` }));
  },
};
