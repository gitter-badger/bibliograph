/** FILE IS GENERATED, ANY CHANGES WILL BE OVERWRITTEN */

/**
 * A controller for JSONRPC methods intended to test the application.
 * 
 * @see app\controllers\TestController
 * @file /Users/cboulanger/Code/bibliograph/src/server/controllers/TestController.php
 */
qx.Class.define("rpc.Test",
{ 
  type: 'static',
  statics: {
    /**
     * @return {Promise}
     * @see TestController::actionError
     */
    error : function(){
      return this.getApplication().getRpcClient("test").send("error", []);
    },

    /**
     * @return {Promise}
     * @see TestController::actionTest
     */
    test : function(){
      return this.getApplication().getRpcClient("test").send("test", []);
    },

    /**
     * @param result 
     * @param message 
     * @return {Promise}
     * @see TestController::actionTest2
     */
    test2 : function(result=null, message=null){
      // @todo Document type for 'result' in app\controllers\TestController::actionTest2
      // @todo Document type for 'message' in app\controllers\TestController::actionTest2
      return this.getApplication().getRpcClient("test").send("test2", [result, message]);
    },

    /**
     * @param message 
     * @return {Promise}
     * @see TestController::actionAlert
     */
    alert : function(message=null){
      // @todo Document type for 'message' in app\controllers\TestController::actionAlert
      return this.getApplication().getRpcClient("test").send("alert", [message]);
    },

    /**
     * @return {Promise}
     * @see TestController::actionSimpleEvent
     */
    simpleEvent : function(){
      return this.getApplication().getRpcClient("test").send("simple-event", []);
    },

    /**
     * 
     * 
     * @param json {String} 
     * @return {Promise}
     * @see TestController::actionShelve
     */
    shelve : function(json=null){
      qx.core.Assert.assertString(json);
      return this.getApplication().getRpcClient("test").send("shelve", [json]);
    },

    /**
     * 
     * 
     * @param shelfId 
     * @return {Promise}
     * @see TestController::actionUnshelve
     */
    unshelve : function(shelfId=null){
      // @todo Document type for 'shelfId' in app\controllers\TestController::actionUnshelve
      return this.getApplication().getRpcClient("test").send("unshelve", [shelfId]);
    },

    /**
     * @return {Promise}
     * @see TestController::actionCreateSearch
     */
    createSearch : function(){
      return this.getApplication().getRpcClient("test").send("create-search", []);
    },

    /**
     * @return {Promise}
     * @see TestController::actionRetrieveSearch
     */
    retrieveSearch : function(){
      return this.getApplication().getRpcClient("test").send("retrieve-search", []);
    },

    /**
     * @return {Promise}
     * @see TestController::actionIndex
     */
    index : function(){
      return this.getApplication().getRpcClient("test").send("index", []);
    }
  }
});