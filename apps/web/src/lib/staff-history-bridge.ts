// Register before the app router so a guarded history traversal cannot unmount
// an editor before staff navigation has decided whether it may proceed.
export const STAFF_HISTORY_BRIDGE = "window.addEventListener('popstate',function(event){window.dispatchEvent(new CustomEvent('cms:before-history',{detail:event}));},true);";
