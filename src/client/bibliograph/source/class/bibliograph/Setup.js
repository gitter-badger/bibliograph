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
 * This is a qooxdoo singleton class
 * 
 */
qx.Class.define("bibliograph.Setup", {
  extend: qx.core.Object,
  type: "singleton",
  include : [qcl.ui.MLoadingPopup, qx.locale.MTranslation],

  members: {

    /**
     * Dummy method to mark dynamically generated messages for translation
     */
    markForTranslation : function()
    {
      this.tr("No connection to server.");
      this.tr("Loading folder data ...");
    },

    /*
    ---------------------------------------------------------------------------
      BOOT
    ---------------------------------------------------------------------------
    */

    boot : async function(){

      //  Mixes `getApplication()` into all qooxdoo objects
      qx.Class.include( qx.core.Object, qcl.application.MGetApplication );
      // Mixes `widgetId` property into all qooxdoo objects
      qx.Class.include( qx.core.Object, qcl.application.MWidgetId );

      // initialize application commands
      bibliograph.Commands.getInstance();
      
      let app = this.getApplication();
      
      // save state from querystring
      this.saveApplicationState();

      // create main UI Layout
      bibliograph.ui.Windows.getInstance().create();
      bibliograph.ui.MainLayout.getInstance().create();
      
      // show the splash screen
      this.createPopup({
        icon : "bibliograph/icon/bibliograph-logo.png",
        iconPosition : "top",
        width : 550,
        height : 170
      });
      this.showPopup(this.getSplashMessage(), null);
      
      // blocker      
      this.createBlocker();

      //  allow incoming server dialogs
      qcl.ui.dialog.Dialog.allowServerDialogs(true);

      // server setup
      this.showPopup(this.getSplashMessage(this.tr("Setting up application...")));
      await this.checkServerSetup();
      
      // authenticate
      this.showPopup(this.getSplashMessage(this.tr("Connecting with server...")));    
      await this.authenticate();
      qx.event.message.Bus.dispatch(new qx.event.message.Message("connected"));

      // load config & permissions
      this.showPopup(this.getSplashMessage(this.tr("Loading configuration ...")));
      await this.loadConfig();
      await this.loadUserdata();

      // load plugins
      this.loadPlugins();

      // datasources
      this.showPopup(this.getSplashMessage(this.tr("Loading datasources ...")));
      await this.setupDatasourceStore();

      // initialize application state
      //app.getStateManager().setHistorySupport(true);
      //app.getStateManager().updateState();

      // reset splash screen
      this.hidePopup();
      this.createPopup();

      // restore app state 
      //this.restoreApplicationState();

      // message transport
      //this.startPolling();

      qx.event.message.Bus.dispatchByName("bibliograph.setup.completed");
    },

    /*
    ---------------------------------------------------------------------------
      SETUP METHODS
    ---------------------------------------------------------------------------
    */  
    
    
    /** 
     * save some intial application states which would otherwise be overwritten
     */
    saveApplicationState : function(){
      let app = this.getApplication();
      this.__itemView = app.getStateManager().getState("itemView");
      this.__folderId = app.getStateManager().getState("folderId");
      this.__query    = app.getStateManager().getState("query");
      this.__modelId  = app.getStateManager().getState("modelId");
    },

    createBlocker : function(){
      let app = this.getApplication();
      let blocker = new qx.ui.core.Blocker(app.getRoot());
      blocker.setOpacity( 0.5 );
      blocker.setColor( "black" );
      app.__blocker = blocker;
    },

    /**
     * Returns the message displayed below the splash screen icon.
     * By default, return the version and copyright text.
     * @param text {String} Optional text appended to the splash message
     * @return {String}
     */
    getSplashMessage : function(text) {
      let app = this.getApplication();
      return app.getVersion() + "<br />" + app.getCopyright() + "<br />" + (text || "");
    },  

    /**
     * This will initiate server setup. When done, server will send a 
     * "bibliograph.setup.done" message.
     */
    checkServerSetup : async function(){
      this.getApplication().getRpcClient("setup").send("setup");
      await this.getApplication().resolveOnMessage("bibliograph.setup.done");
      this.info("Server setup done.");
    },

    /**
     * Unless we have a token in the session storage, authenticate
     * anomymously with the server.
     */
    authenticate : async function(){
      let am = bibliograph.AccessManager.getInstance();
      let token = am.getToken();
      let client = this.getApplication().getRpcClient("access");
      if( ! token ) {
      this.info("Authenticating with server...");
      let response = await client.send("authenticate",[]);
      if( ! response ) {
        return this.error("Cannot authenticate with server: " + client.getErrorMessage() );
      }
      let { message, token, sessionId } = response; 
      this.info(message);
      
      am.setToken(token);
      am.setSessionId(sessionId);
      this.info("Acquired access token.");
      } else {
      this.info("Got access token from session storage" );
      }
    },

    loadConfig : async function(){
      this.info("Loading config values...");
      await this.getApplication().getConfigManager().init().load();
      this.info("Config values loaded.");
    },

    loadUserdata : async function(){
      this.info("Loading userdata...");
      await this.getApplication().getAccessManager().init().load();
      this.info("Userdata loaded.");
    },

    /**
     * Setup the list of available datasources
     */
    setupDatasourceStore : async function()
    {
      let app = this.getApplication();
      let datasourceStore = new bibliograph.io.JsonRpcStore("datasource");
      // configure event handler for when datasources are loaded
      datasourceStore.addListener("loaded", this._on_datasourceStore_loaded, this);  
      
      // load it
      await datasourceStore.load();  
      // reload on message
      // todo: "authenticated" "loggedout"
      qx.event.message.Bus.subscribe("reloadDatasources", function() {
        datasourceStore.reload();
      }); 

      // save in app property
      app.setDatasourceStore(datasourceStore);
    },    

    /**
     * Loads the plugins
     */
    loadPlugins : async function()
    {
      this.warn("Plugins not implemented, skipping...");
      return; 

      this.info("Loading plugins...");
      this.showPopup(this.getSplashMessage(this.tr("Loading plugins ...")));
      let pluginManager = bibliograph.PluginManager().getInstance();
      pluginManager.addListener("loadingPlugin", function(e)
      {
        var data = e.getData();
        this.showPopup(this.getSplashMessage(this.tr("Loaded plugin %1 of %2 : %3 ...", data.count, data.sum, data.name)));
      }, this);

      /*
        * load plugin code
        */
      pluginManager.setPreventCache(true);
      await pluginManager.loadPlugins();
    },  

    /**
     * Initialize  subscribers for server messages
     */
    initSubscribers : function()
    {
      var bus = qx.event.message.Bus.getInstance();

      // listen to reload event
      bus.subscribe("application.reload", function(e){
        window.location.reload();
      }, this);       

      // remotely log to the browser console
      bus.subscribe("console.log", function(e){
        console.log(e.getData());
      }, this);

      // server message to force logout the user
      bus.subscribe("client.logout", function(e){
        this.logout();
      }, this);

      // server message to set model type and id
      bus.subscribe("bibliograph.setModel", function(e){
        var data = e.getData();
        if (data.datasource == this.getDatasource())
        {
          this.setModelType(data.modelType);
          this.setModelId(data.modelId);
        }
      }, this);

      // used by the bibliograph.export.exportReferencesHandleDialogData
      bus.subscribe("window.location.replace", function(e){
        var data = e.getData();
        window.location.replace(data.url);
      }, this);
      
      // reload the main list view
      bus.subscribe("mainListView.reload", function(e){
        var data = e.getData();
        if (data.datasource !== this.getDatasource())return;
        this.getWidgetById("bibliograph/mainListView").reload();
      }, this);

      // show the login dialog
      bus.subscribe("loginDialog.show", function(){
        this.getWidgetById("bibliograph/loginDialog").show();
      }, this);
    },  

    restoreApplicationState : function()
    {
      let app = this.getApplication();
      if (this.__itemView) {
        this.setItemView(this.__itemView);
      }
      if (this.__selectedIds) {
        var selectedIds = [];
        this.__selectedIds.split(",").forEach(function(id) {
          id = parseInt(id);
          if (id && !isNaN(id))selectedIds.push(id);
        }, this);
      }
      if (this.__folderId && !isNaN(parseInt(this.__folderId))) {
        this.info("Restoring folder id: " + this.__folderId);
        this.setFolderId(parseInt(this.__folderId))
      } else if (this.__query) {
        this.info("Restoring query: " + this.__query);
        this.setQuery(this.__query);
      }
      if (this.__modelId && !isNaN(parseInt(this.__modelId))) {
        this.info("Restoring model id: " + this.__modelId);
        this.setModelId(parseInt(this.__modelId))
      }
    },

    /**
     * Start polling service to get messages when no server action
     * happens
     */
    startPolling : async function() {
      let delayInMs = await this.getApplication().getRpcClient("message").send("getMessages");
      if( delayInMs ){
        qx.lang.Function.delay(this.startPolling,delayInMs,this);
      }
    },

    /*
    ---------------------------------------------------------------------------
        EVENT LISTENERS
    ---------------------------------------------------------------------------
    */
    
    _on_datasourceStore_loaded : function(e)
    {
      let data = e.getData();
      console.debug(qx.util.Serializer.toNativeObject(data));
      return; 

      let app = this.getApplication();    
      var datasourceCount = data.length;
      // if we have no datasource loaded, no access
      if (datasourceCount == 0) {
        dialog.Dialog.alert(app.tr("You don't have access to any datasource on the server."));
      }
      // if we have access to exactly one datasource, load this one
      else if (datasourceCount == 1) {
        var item = data.getItem(0);
        app.setDatasource(item.getValue()); //???
        app.setDatasourceLabel(item.getTitle());
        app.getStateManager().updateState();
      }
      // else, we have a choice of datasource
      else
      {
        // if there is one saved in the application state, use this
        var datasource = app.getStateManager().getState("datasource");
        if (!datasource)
        {
          app.setDatasourceLabel(app.getConfigManager().getKey("application.title"));
          var dsWin = app.getWidgetById("bibliograph/datasourceWindow");
          dsWin.open();
          dsWin.center();
        } else {
          app.setDatasource(datasource);
          app.getStateManager().updateState();
        }
      }

      /*
      * show datasource button depending on whether there is a choice
      */
      app.getWidgetById("bibliograph/datasourceButton").setVisibility(datasourceCount > 1 ? "visible" : "excluded");
    },


    /** Applies the foo property */
    _applyFoo: function(value, old) {
      //
    }
  }
});