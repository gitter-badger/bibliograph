/*******************************************************************************
 *
 * Bibliograph: Online Collaborative Reference Management
 *
 * Copyright: 2007-2014 Christian Boulanger
 *
 * License: LGPL: http://www.gnu.org/licenses/lgpl.html EPL:
 * http://www.eclipse.org/org/documents/epl-v10.php See the LICENSE file in the
 * project's top-level directory for details.
 *
 * Authors: Christian Boulanger (cboulanger)
 *
 ******************************************************************************/

/*global qx qcl*/

/**
 * @asset(qx/icon/${qx.icontheme}/22/categories/system.png)
 * @asset(qx/icon/${qx.icontheme}/16/status/dialog-password.png)
 * @asset(qx/icon/${qx.icontheme}/16/apps/preferences-users.png)
 * @asset(bibliograph/icon/16/search.png)
 * @asset(qx/icon/${qx.icontheme}/22/apps/utilities-help.png)
 * @asset(bibliograph/icon/16/help.png)
 * @asset(qx/icon/${qx.icontheme}/16/apps/utilities-archiver.png)
 * @asset(qx/icon/${qx.icontheme}/22/places/network-server.png)
 * @asset(qx/icon/${qx.icontheme}/16/actions/application-exit.png)
 * @asset(bibliograph/icon/16/cancel.png)
 * @ignore(qcl.bool2visibility)
 */
qx.Class.define("bibliograph.ui.main.Toolbar",
{
  extend : qx.ui.toolbar.ToolBar,
  construct : function()
  {
    this.base(arguments);
    this.__qxtCreateUI();
  },
  members : {
    __qxtCreateUI : function()
    {
      //connecting autogenerated id with 'this'
      var qxToolBar1 = this;
      var qxToolBarPart1 = new qx.ui.toolbar.Part();
      qxToolBar1.add(qxToolBarPart1);

      /*
       * Login Button
       */
      var loginButton = new qx.ui.toolbar.Button(this.tr('Login'), "icon/16/status/dialog-password.png", null);
      loginButton.setLabel(this.tr('Login'));
      loginButton.setVisibility("excluded");
      loginButton.setIcon("icon/16/status/dialog-password.png");
      qxToolBarPart1.add(loginButton);
      this.getApplication().bind("accessManager.authenticatedUser", loginButton, "visibility", {
        converter : function(v) {
          return v ? 'excluded' : 'visible'
        }
      });
      loginButton.addListener("execute", function(e) {
        this.getApplication().login();
      }, this);

      /*
       * Logout Button
       */
      var logoutButton = new qx.ui.toolbar.Button(this.tr('Logout'), "icon/16/actions/application-exit.png", null);
      logoutButton.setLabel(this.tr('Logout'));
      logoutButton.setVisibility("excluded");
      logoutButton.setIcon("icon/16/actions/application-exit.png");
      qxToolBarPart1.add(logoutButton);
      this.getApplication().bind("accessManager.authenticatedUser", logoutButton, "visibility", {
        converter : function(v) {
          return v ? 'visible' : 'excluded'
        }
      });
      logoutButton.addListener("execute", function(e) {
        this.getApplication().logout();
      }, this);

      /*
       * User button
       */
      var qxToolBarButton1 = new qx.ui.toolbar.Button(this.tr('Loading...'), "icon/16/apps/preferences-users.png", null);
      qxToolBarButton1.setLabel(this.tr('Loading...'));
      qxToolBarButton1.setIcon("icon/16/apps/preferences-users.png");
      qxToolBarPart1.add(qxToolBarButton1);
      this.getApplication().bind("accessManager.userManager.activeUser.fullname", qxToolBarButton1, "label", {

      });
      this.getApplication().bind("accessManager.authenticatedUser", qxToolBarButton1, "visibility", {
        converter : function(v) {
          return v ? 'visible' : 'excluded'
        }
      });
      qxToolBarButton1.addListener("execute", function(e) {
        this.getApplication().editUserData();
      }, this);

      var qxToolBarPart2 = new qx.ui.toolbar.Part();
      qxToolBar1.add(qxToolBarPart2);

      /*
       * Datasources
       */
      var qxToolBarButton2 = new qx.ui.toolbar.Button(this.tr('Datasources'), "icon/16/apps/utilities-archiver.png", null);
      qxToolBarButton2.setLabel(this.tr('Datasources'));
      qxToolBarButton2.setWidgetId("datasourceButton");
      qxToolBarButton2.setVisibility("excluded");
      qxToolBarButton2.setIcon("icon/16/apps/utilities-archiver.png");
      qxToolBarPart2.add(qxToolBarButton2);
      qxToolBarButton2.addListener("execute", function(e) {
        this.getApplication().getWidgetById("datasourceWindow").show();
      }, this);

      /*
       * System
       */
      var qxToolBarMenuButton1 = new qx.ui.toolbar.MenuButton(this.tr('System'), "icon/22/categories/system.png", null);
      qxToolBarMenuButton1.setIcon("icon/22/categories/system.png");
      qxToolBarMenuButton1.setVisibility("excluded");
      qxToolBarMenuButton1.setLabel(this.tr('System'));
      qxToolBarPart2.add(qxToolBarMenuButton1);
      qx.core.Init.getApplication().getAccessManager().getPermissionManager().create("system.menu.view").bind("state", qxToolBarMenuButton1, "visibility", {
        converter : qcl.bool2visibility
      });

      /*
       * Preferences
       */
      var qxMenu1 = new qx.ui.menu.Menu();
      qxToolBarMenuButton1.setMenu(qxMenu1);
      var qxMenuButton1 = new qx.ui.menu.Button(this.tr('Preferences'), null, null, null);
      qxMenuButton1.setLabel(this.tr('Preferences'));
      qxMenu1.add(qxMenuButton1);
      qx.core.Init.getApplication().getAccessManager().getPermissionManager().create("preferences.view").bind("state", qxMenuButton1, "visibility", {
        converter : qcl.bool2visibility
      });
      qxMenuButton1.addListener("execute", function(e) {
        var win = this.getApplication().getWidgetById("preferencesWindow").show();
      }, this);

      /*
       * Access management
       */
      var qxMenuButton2 = new qx.ui.menu.Button(this.tr('Access management'), null, null, null);
      qxMenuButton2.setLabel(this.tr('Access management'));
      qxMenu1.add(qxMenuButton2);
      qx.core.Init.getApplication().getAccessManager().getPermissionManager().create("access.manage").bind("state", qxMenuButton2, "visibility", {
        converter : qcl.bool2visibility
      });
      qxMenuButton2.addListener("execute", function(e) {
        var win = this.getApplication().getWidgetById("accessControlTool").show();
      }, this);

      /*
       * Plugins
       */
      var qxMenuButton3 = new qx.ui.menu.Button(this.tr('Plugins'), null, null, null);
      qxMenuButton3.setLabel(this.tr('Plugins'));
      qxMenu1.add(qxMenuButton3);
      qx.core.Init.getApplication().getAccessManager().getPermissionManager().create("plugin.manage").bind("state", qxMenuButton3, "visibility", {
        converter : qcl.bool2visibility
      });
      qxMenuButton3.addListener("execute", function(e) {
        this.getApplication().getRpcManager().execute("bibliograph.plugin", "manage");
      }, this);

      /*
       * Backup menu
       */
      var qxMenuButton4 = new qx.ui.menu.Button(this.tr('Backup'), null, null, null);
      qxMenuButton4.setLabel(this.tr('Backup'));
      qxMenu1.add(qxMenuButton4);
      qx.core.Init.getApplication().getAccessManager().getPermissionManager().create("backup.create").bind("state", qxMenuButton4, "visibility", {
        converter : qcl.bool2visibility
      });
      var qxMenu2 = new qx.ui.menu.Menu();
      qxMenuButton4.setMenu(qxMenu2);
      var qxMenuButton5 = new qx.ui.menu.Button(this.tr('Create Backup'), null, null, null);
      qxMenuButton5.setLabel(this.tr('Create Backup'));
      qxMenu2.add(qxMenuButton5);
      qxMenuButton5.addListener("execute", function(e) {
        this.getApplication().getRpcManager().execute("bibliograph.backup", "dialogCreateBackup", [this.getApplication().getDatasource()]);
      }, this);
      var qxMenuButton6 = new qx.ui.menu.Button(this.tr('Restore Backup'), null, null, null);
      qxMenuButton6.setLabel(this.tr('Restore Backup'));
      qxMenu2.add(qxMenuButton6);
      qxMenuButton6.addListener("execute", function(e) {
        this.getApplication().getRpcManager().execute("bibliograph.backup", "dialogRestoreBackup", [this.getApplication().getDatasource()]);
      }, this);
      var qxMenuButton7 = new qx.ui.menu.Button(this.tr('Delete old backups'), null, null, null);
      qxMenuButton7.setLabel(this.tr('Delete old backups'));
      qxMenu2.add(qxMenuButton7);
      qxMenuButton7.addListener("execute", function(e) {
        this.getApplication().getRpcManager().execute("bibliograph.backup", "dialogDeleteBackups", [this.getApplication().getDatasource()]);
      }, this);

      /*
       * Import Menu
       */
      var qxToolBarMenuButton2 = new qx.ui.toolbar.MenuButton(this.tr('Import'), "icon/22/places/network-server.png", null);
      qxToolBarMenuButton2.setLabel(this.tr('Import'));
      qxToolBarMenuButton2.setIcon("icon/22/places/network-server.png");
      qxToolBar1.add(qxToolBarMenuButton2);
      qx.core.Init.getApplication().getAccessManager().getPermissionManager().create("reference.import").bind("state", qxToolBarMenuButton2, "visibility", {
        converter : qcl.bool2visibility
      });
      var qxMenu3 = new qx.ui.menu.Menu();
      qxMenu3.setWidgetId("importMenu");
      qxToolBarMenuButton2.setMenu(qxMenu3);

      /*
       * Import Text file
       */
      var qxMenuButton8 = new qx.ui.menu.Button(this.tr('Import text file'), null, null, null);
      qxMenuButton8.setLabel(this.tr('Import text file'));
      qxMenu3.add(qxMenuButton8);
      qxMenuButton8.addListener("execute", function(e) {
        this.getApplication().getWidgetById("importWindow").show();
      }, this);


      /*
       * Help menu
       */
      var qxToolBarMenuButton3 = new qx.ui.toolbar.MenuButton(this.tr('Help'), "icon/22/apps/utilities-help.png", null);
      qxToolBarMenuButton3.setLabel(this.tr('Help'));
      qxToolBarMenuButton3.setIcon("icon/22/apps/utilities-help.png");
      qxToolBar1.add(qxToolBarMenuButton3);
      var qxMenu4 = new qx.ui.menu.Menu();
      qxToolBarMenuButton3.setMenu(qxMenu4);

      /*
       * Online help
       */
      var qxMenuButton9 = new qx.ui.menu.Button(this.tr('Online Help'), null, null, null);
      qxMenuButton9.setLabel(this.tr('Online Help'));
      qxMenu4.add(qxMenuButton9);
      qxMenuButton9.addListener("execute", function(e) {
        this.getApplication().showHelpWindow();
      }, this);

      /*
       * Bug report
       */
      var qxMenuButton10 = new qx.ui.menu.Button(this.tr('Report a problem or request a feature'), null, null, null);
      qxMenuButton10.setVisibility("excluded");
      qxMenuButton10.setLabel(this.tr('Report a problem or request a feature'));
      qxMenu4.add(qxMenuButton10);
      qx.core.Init.getApplication().getAccessManager().getPermissionManager().create("application.reportBug").bind("state", qxMenuButton10, "visibility", {
        converter : qcl.bool2visibility
      });
      qxMenuButton10.addListener("execute", function(e) {
        this.getApplication().reportBug();
      }, this);

      /*
       * About
       */
      var qxMenuButton11 = new qx.ui.menu.Button(this.tr('About Bibliograph'), null, null, null);
      qxMenuButton11.setLabel(this.tr('About Bibliograph'));
      qxMenu4.add(qxMenuButton11);
      qxMenuButton11.addListener("execute", function(e) {
        this.getApplication().showAboutWindow();
      }, this);

      /*
       * Datasource name
       */
      var qxAtom1 = new qx.ui.basic.Atom(null, null);
      qxToolBar1.add(qxAtom1, {
        flex : 10
      });
      var applicationTitleLabel = new qx.ui.basic.Label(null);
      this.applicationTitleLabel = applicationTitleLabel;
      applicationTitleLabel.setPadding(10);
      applicationTitleLabel.setWidgetId("applicationTitleLabel");
      applicationTitleLabel.setRich(true);
      applicationTitleLabel.setTextAlign("right");
      qxToolBar1.add(applicationTitleLabel);

      /*
       * Label to indicate application mode
       */
      var qxAtom2 = new qx.ui.basic.Atom(null, null);
      qxToolBar1.add(qxAtom2, {
        flex : 1
      });
      qx.event.message.Bus.subscribe("application.setMode",function (e){
        var mode= e.getData();
        this.info("Switching application mode to '" + mode + "'." );
        var label = null;
        var toolTipText = null;
        var textColor = null;
        var visibility = "visible";
        switch( mode ){
          case "maintenance":
            label = this.tr("Maintenance Mode");
            toolTipText = this.tr("The application is currently in maintenance mode. You might experience problems. Please come back later.");
            textColor = "red";
            break;
          case "development":
            label = this.tr("Development Mode");
            toolTipText = this.tr("The application is currently in development mode. This should never be the case on a public server.");
            textColor = "green";
            break;
          default:
            visibility="excluded";
        };
        qxAtom2.set({
          "visibility": visibility,
          "label" : label,
          "toolTipText" : toolTipText,
          "textColor" : textColor
        });
      },this);

      /*
       * Search Box
       */
      var searchbox = new qx.ui.form.TextField(null);
      this.searchbox = searchbox;
      searchbox.setWidgetId("searchBox");
      searchbox.setMarginTop(8);
      searchbox.setPlaceholder(this.tr('Enter search term'));
      qxToolBar1.add(searchbox, {
        flex : 1
      });
      qx.core.Init.getApplication().getAccessManager().getPermissionManager().create("reference.search").bind("state", searchbox, "visibility", {
        converter : qcl.bool2visibility
      });
      searchbox.addListener("keypress", function(e) {
        if (e.getKeyIdentifier() == "Enter")
        {
          var app = this.getApplication();
          var query = searchbox.getValue();
          app.setFolderId(0);
          app.setQuery(query);
          qx.event.message.Bus.dispatch(new qx.event.message.Message("bibliograph.userquery", query));
          app.getWidgetById("searchHelpWindow").hide();
        }
      }, this);
      searchbox.addListener("dblclick", function(e) {
        e.stopPropagation();
      }, this);
      searchbox.addListener("focus", function(e)
      {
        searchbox.setLayoutProperties( {
          flex : 10
        });
        this.getApplication().setInsertTarget(searchbox);
      }, this);
      searchbox.addListener("blur", function(e)
      {
        var timer = qx.util.TimerManager.getInstance();
        timer.start(function() {
          if (!qx.ui.core.FocusHandler.getInstance().isFocused(searchbox)) {
            searchbox.setLayoutProperties( {
              flex : 1
            });
          }
        }, null, this, null, 5000);
      }, this);

//      /*
//       * Experimental
//       */
////      var tokenfield = new tokenfield.Token();
//      tokenfield
//        .setLabelPath("name")
//        .setHintText(this.tr('Enter search term'));
//      qxToolBar1.add(tokenfield, { flex : 1 });
//      tokenfield.addListener("loadData", function(e)
//      {
//        var str = e.getData();
//        var data = [];
//        for (var i = 0; i < mockdata.length; i++) {
//          if( mockdata[i].name.toLowerCase().indexOf(str.toLowerCase()) !== -1 )
//          {
//            data.push(mockdata[i]);
//          }
//        }
//        qx.util.TimerManager.getInstance().start(function() {
//          t.populateList(str, data);
//        }, null, this, null, 500);
//      }, this);


      /*
       * Buttons
       */
      var qxToolBarButton3 = new qx.ui.toolbar.Button(null, "bibliograph/icon/16/search.png", null);
      qxToolBarButton3.setIcon("bibliograph/icon/16/search.png");
      qxToolBar1.add(qxToolBarButton3);
      qx.core.Init.getApplication().getAccessManager().getPermissionManager().create("reference.search").bind("state", qxToolBarButton3, "visibility", {
        converter : qcl.bool2visibility
      });
      qxToolBarButton3.addListener("execute", function(e)
      {
        var query = this.searchbox.getValue();
        var app = this.getApplication();
        app.getWidgetById("searchHelpWindow").hide();
        app.setFolderId(0);
        if (app.getQuery() == query)app.setQuery(null);

        app.setQuery(query);
        qx.event.message.Bus.dispatch(new qx.event.message.Message("bibliograph.userquery", query));
      }, this);
      var qxToolBarButton4 = new qx.ui.toolbar.Button(null, "bibliograph/icon/16/cancel.png", null);
      qxToolBarButton4.setIcon("bibliograph/icon/16/cancel.png");
      qxToolBarButton4.setMarginRight(5);
      qxToolBar1.add(qxToolBarButton4);
      qx.core.Init.getApplication().getAccessManager().getPermissionManager().create("reference.search").bind("state", qxToolBarButton4, "visibility", {
        converter : qcl.bool2visibility
      });
      qxToolBarButton4.addListener("execute", function(e)
      {
        this.searchbox.setValue("");
        this.searchbox.focus();
        this.getApplication().getWidgetById("searchHelpWindow").hide();
      }, this);
      var qxToolBarButton5 = new qx.ui.toolbar.Button(null, "bibliograph/icon/16/help.png", null);
      qxToolBarButton5.setIcon("bibliograph/icon/16/help.png");
      qxToolBarButton5.setMarginRight(5);
      qxToolBar1.add(qxToolBarButton5);
      qx.core.Init.getApplication().getAccessManager().getPermissionManager().create("reference.search").bind("state", qxToolBarButton5, "visibility", {
        converter : qcl.bool2visibility
      });
      qxToolBarButton5.addListener("execute", function(e)
      {
        var hwin = this.getApplication().getWidgetById("searchHelpWindow");
        hwin.show();
        hwin.center();
      }, this);
    }
  }
});
