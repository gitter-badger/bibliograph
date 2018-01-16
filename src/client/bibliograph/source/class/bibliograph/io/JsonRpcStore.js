/* ************************************************************************

  Bibliograph. The open source online bibliographic data manager

  http://www.bibliograph.org

  Copyright: 
    2018 Christian Boulanger

  License: 
    MIT license
    See the LICENSE file in the project's top-level directory for details.

  Authors: 
    Christian Boulanger (@cboulanger) info@bibliograph.org

************************************************************************ */

/**
 * 
 * The jsonrpc data store is responsible for fetching data from a json-rpc
 * server backend. The data will be processed by the marshaler that you supply as
 * third parameter in the constructor. If you don't supply one, the default
 * qx.data.marshal.Json will be used. 
 * 
 */
qx.Class.define("bibliograph.io.JsonRpcStore",
{
  
  extend : qx.core.Object,
  
  /**  
    * @param serviceName {String|null} The name of the service, i.e. "foo.bar"   
    * @param marshaler {Object|null} The marshaler to be used to create a model 
    *   from the data. If not provided, {@link qx.data.marshal.Json} is used and
    *   instantiated with the 'delegate' parameter as constructor argument.
    * @param delegate {Object|null} The delegate containing one of the methods 
    *   specified in {@link qx.data.store.IStoreDelegate}. Ignored if a 
    *   custom marshaler is provided
    */
    construct : function( serviceName, marshaler, delegate )
    {
      this.base(arguments);
      if ( ! marshaler ) {
        this.setMarshaler( new qx.data.marshal.Json(delegate) );
      } else {
        this.setMarshaler( marshaler );
      } 
      if( ! serviceName ){
        throw new Error("Missing service name");
      }
      this.setServiceName( serviceName );
    },

    /*
    *****************************************************************************
      EVENTS
    *****************************************************************************
    */  
    events : 
    {
      /**
      * Data event fired after the model has been created. The data will be the 
      * created model.
      */
      "loaded": "qx.event.type.Data",
      
      /**
      * The change event which will be fired if there is a change in the array.
      * The data contains a map with three key value pairs:
      * <li>start: The start index of the change.</li>
      * <li>end: The end index of the change.</li>
      * <li>type: The type of the change as a String. This can be 'add',  
      * 'remove' or 'order'</li>
      * <li>items: The items which has been changed (as a JavaScript array).</li>
      */
    "change" : "qx.event.type.Data",
    
    /**
      * Event signaling that the model data has changed
      */
    "changeBubble" : "qx.event.type.Data",
    
    /**
      * Error event
      */
    "error" : "qx.event.type.Data"
    },

    /*
    *****************************************************************************
      PROPERTIES
    *****************************************************************************
    */

    properties : 
    {
      
      /**
       * The unique id of the store
       */
      storeId :
      {
        check : "String",
        nullable : true,
        init : null
      },
      
     /**
      * Property for holding the loaded model instance.
      */
      model : 
      {
        check : "qx.core.Object",
        nullable: true,
        event: "changeModel"
      },

     /**
      * The name of the jsonrpc service
      */
      serviceName : 
      {
        check : "String",
        nullable: false,
        event: "changeServiceName",
        apply : "_applyServiceName"
      },      
  
      /**
       * The name of the service method that is called on the server when the load()
       * method is called without arguments. Defaults to "load"
       */
      loadMethod :
      {
        check : "String",
        init : "load",
        event : "changeLoadMethod"
      },
    
      /**
       * The marshaler used to create models from the json data
       */
      marshaler : {
        check: "Object",
        nullable: true
      },
      
      autoLoadMethod:
      {
        check     : "String",
        nullable  : true,
        apply     : "_applyAutoLoadMethod",
        event     : "changeAutoLoadMethod"
      },
      
      autoLoadParams:
      {
        nullable  : true,
        apply     : "_applyAutoLoadParams",
        event     : "changeAutoLoadParams"
      }
    },

    /*
    *****************************************************************************
      MEMBERS
    *****************************************************************************
    */

    members :
    {
      /*
      ---------------------------------------------------------------------------
        PRIVATE MEMBERS
      ---------------------------------------------------------------------------
      */  
      _responseData : null,
      __request : null,
      __pool : null,
      __client : null,
      __requestId : 0,
      __requestCounter : 0,
      __lastMethod : null,
      __lastParams : null,
      
      /*
      ---------------------------------------------------------------------------
        APPLY METHODS
      ---------------------------------------------------------------------------
      */ 

      _applyServiceName : function( value, old)
      {
        if( ! value ) return; // @todo hack!!
        this.__client = this.getApplication().getRpcClient(value);
      },
      
      _applyAutoLoadMethod : function( value, old)
      {
        if ( this.getAutoLoadParams() )
        {
          this.load( value, this.getAutoLoadParams() );
        }
      },

      _applyAutoLoadParams : function( value, old)
      {
        if ( qx.lang.Type.isString( value ) )
        {
          value = value.split(",");
        } 
        if (value && this.getAutoLoadMethod() )
        {
          this.load( this.getAutoLoadMethod(), value );
        }
      },    
      
      /*
      ---------------------------------------------------------------------------
        PRIVATE METHODS
      ---------------------------------------------------------------------------
      */     

      /**  
       * Send json-rpc request with arguments
       * @param serviceMethod {String} Method to call
       * @param params {Array} Array of arguments passed to the service method
       * @param finalCallback {function} The callback function that is called with
       *   the result of the request
       * @param context {Object} The context of the callback function
       * @param createModel {Boolean}
       * @param {Promise<Object>} Promise that resolves with the loaded data 
       */
      _sendJsonRpcRequest : function( serviceMethod, params, finalCallback, context, createModel )
      {
        var client = this.__client;
        return client.send( serviceMethod, params || [] )
        .then((data) => {
          if ( createModel ){
            if( ! qx.lang.Type.isObject( this.getMarshaler() ) ) {
              throw new Error("Cannot marshal data - no marshaller set!");
            }
            this.getMarshaler().toClass( data, true );
            var model = this.getMarshaler().toModel(data);
            this.setModel( model );            
            // fire 'loaded' event only if we created a model
            this.fireDataEvent( "loaded", model );             
          }
          if ( typeof finalCallback == "function" ){
            // execute outside of the current stack so callback errors do not break the current execution context
            qx.lang.Function.delay(finalCallback,0,context,data);
          }            
        })
        .catch((ex)=>{
          this.error(ex);
          this.fireDataEvent( "error", ex );
          this.fireDataEvent( "loaded", null);
        }); 
      },

      /*
      ---------------------------------------------------------------------------
          API METHODS
      ---------------------------------------------------------------------------
      */

      /** 
       * Loads the data from a service method asynchroneously. 
       * @param serviceMethod {String} Method to call
       * @param params {Array} Array of arguments passed to the service method
       * @param finalCallback {function} The callback function that is called with
       *   the result of the request
       * @param context {Object} The context of the callback function
       * @param {Promise<Object>} Promise that resolves with the loaded data 
       */
      load : function( serviceMethod, params=[], finalCallback, context  )
      {
        serviceMethod = serviceMethod||this.getLoadMethod();
        this.__lastMethod = serviceMethod;
        this.__lastParams = params;
        return this._sendJsonRpcRequest( 
          serviceMethod, 
          params,
          finalCallback, 
          context,
          true
        );
      },
      
      /** 
       * Reloads the data from a service method asynchroneously. Uses the last
       * method and parameters used.
       * 
       * @param callback {function} The callback function that is called with
       *   the result of the request
       * @param context {Object} The context of the callback function
       * @param {Promise<Object>} Promise that resolves with the loaded data
       * 
       */    
      reload : function( callback, context )
      {
        return this.load( this.__lastMethod, this.__lastParams, callback, context );
      },
      
    /** 
      * Executes a service method without loading model data in response. 
      * @param serviceMethod {String} Method to call
      * @param params {Array} Array of arguments passed to the service method
      * @param finalCallback {function} The callback function that is called with
      *   the result of the request
      * @param context {Object} The context of the callback function
      * @param {Promise<Object>} Promise that resolves when the server has executed the service method
      */
    execute : function( serviceMethod, params, finalCallback, context )
    {
      return this._sendJsonRpcRequest( 
        serviceMethod||this.getServiceMethod(), 
        params,
        finalCallback, 
        context,
        false
      );
    }
  }
});