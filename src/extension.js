/* This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const DBus                  = imports.dbus;
const Gio                   = imports.gi.Gio;
const ExtensionUtils        = imports.misc.extensionUtils;
const Lang                  = imports.lang;
const Main                  = imports.ui.main;
const Mainloop              = imports.mainloop;
const Panel                 = imports.ui.panel;
const PanelMenu             = imports.ui.panelMenu;
const PopupMenu             = imports.ui.popupMenu;
const Shell                 = imports.gi.Shell;
const St                    = imports.gi.St;
const Tweener               = imports.ui.tweener;
const Me                    = ExtensionUtils.getCurrentExtension();
const MyUI                  = Me.imports.ui;
const Convenience           = Me.imports.convenience;
const PackageKit            = DBus.makeProxyClass(Me.imports.packagekit_dbus.PackageKitIFace);
const PackageKitTransaction = DBus.makeProxyClass(Me.imports.packagekit_dbus.PackageKitTransactionIFace);

const PACKAGEKIT_BUS = "org.freedesktop.PackageKit";
const PACKAGEKIT_PATH = "/org/freedesktop/PackageKit";

const PanelPosition = {
    CENTER: 0,
    RIGHT: 1,
    LEFT: 2
}

function UpdateButton(settingsFile) {
    this._init(settingsFile);
}

UpdateButton.prototype = {
    __proto__: PanelMenu.Button.prototype,

    _init: function() {
        PanelMenu.Button.prototype._init.call(this, 0.0);
              
        this._settings = Convenience.getSettings();
        this._settings.connect('changed::update-interval', Lang.bind(this, function() {
            this._stopTimeout();
            this._startTimeout();
        }));
        this._settings.connect('changed::position-in-panel', Lang.bind(this, function() {
            this._removeFromPanel();
            this._addToPanel();
        }));
        this._settings.connect('changed::order', Lang.bind(this, function() {
            this._removeFromPanel();
            this._addToPanel();
        }));
        this._settings.connect('changed::hide-if-none', Lang.bind(this, function() {
            this._actionRefresh();
        }));

        this._timeoutSource = -1;		
        this._pkgDaemon = new PackageKit(DBus.system, PACKAGEKIT_BUS, PACKAGEKIT_PATH);
	
        this._label = new St.Label({
            text : "0 Updates"
        });
        this.actor.add_actor(this._label);

        this._updatesMenuItem = new PopupMenu.PopupSubMenuMenuItem("0 Updates");
        this.menu.addMenuItem(this._updatesMenuItem);
        
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        this._refreshMenuItem = new MyUI.ProgressPopupMenuItem("Refresh");
        this._refreshMenuItem.connect('activate', Lang.bind(this, this._actionRefresh));
        this.menu.addMenuItem(this._refreshMenuItem);

        this._updateMenuItem = new MyUI.ProgressPopupMenuItem("Update");
        this._updateMenuItem.connect('activate', Lang.bind(this, this._actionUpdate));
        this.menu.addMenuItem(this._updateMenuItem);
		
        this._upgradeMenuItem = new MyUI.ProgressPopupMenuItem("Upgrade");
        this._upgradeMenuItem.connect('activate', Lang.bind(this, this._actionUpgrade));
        this.menu.addMenuItem(this._upgradeMenuItem);
        
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        
        this._addToPanel();
        Main.panel._menus.addMenu(this.menu);
	
        this._setUILocked(false);
        this._refreshRunning = false;
        this._actionRefresh();
        this._startTimeout();
        this._pkgDaemon.connect('UpdatesChanged', Lang.bind(this, this._actionRefresh));
    },
	
    _startTimeout: function() {
        this._timeoutSource = Mainloop.timeout_add_seconds(this._settings.get_int('update-interval'), Lang.bind(this, this._actionUpdate));
    },
	
    _stopTimeout: function() {
        if(this._timeoutSource >= 0) {
            Mainloop.source_remove(this._timeoutSource);
        }		
    },
	
    _startTransaction: function(callback, arguments) {

        this._pkgDaemon.GetTidRemote(DBus.CALL_FLAG_START, Lang.bind(this, function(tid, error) {
            if(error) {
                this._handlePackageKitError(error);
                return;
            }
            this._pkgTransaction = new PackageKitTransaction(DBus.system, PACKAGEKIT_BUS, tid);
            this._pkgTransaction.connect('Changed', Lang.bind(this, this._onChanged));
            this._pkgTransaction.connect('ItemProgress', Lang.bind(this, this._onProgress));
            this._pkgTransaction.connect('ErrorCode', Lang.bind(this, this._onErrorCode));
            callback.apply(this, arguments);
        }));
    },
    
    _actionRefresh : function() {
        if(this._refreshRunning) {
            return false;
        }
        this._refreshRunning = true;
        this._setUILocked(true);
        this._updatesMenuItem.menu.removeAll();
        this._refreshMenuItem.enableProgress();
        this._updateMenuItem.disableProgress();
        this._upgradeMenuItem.disableProgress();
        this._updateItems = {};

        this._startTransaction(Lang.bind(this, function() {
            this._pkgTransaction.connect('Package', Lang.bind(this, this._onPackageUpdate));
            this._pkgTransaction.connect('Finished', Lang.bind(this, function() {
                let ids = new Array();
                for(key in this._updateItems) { 
                    ids.push( this._updateItems[key]['package_id'] ); 
                }
                if(ids.length > 0) {
                    this._startTransaction(Lang.bind(this, function() {

                        this._pkgTransaction.connect('UpdateDetail', Lang.bind(this, this._onUpdateDetail));
                        this._pkgTransaction.connect('Finished', Lang.bind(this, function() {
                            this._startTransaction(Lang.bind(this, function() {

                                this._pkgTransaction.connect('Details', Lang.bind(this, this._onDetails));
                                this._pkgTransaction.connect('Finished', Lang.bind(this, function() {
                                    this._createUpdateMenuItems();
                                    this._refreshMenuItem.disableProgress();
                                    this._refreshRunning = false;
                                    this._setUILocked(false);
                                }));
                                this._pkgTransaction.GetDetailsRemote(ids, Lang.bind(this, this._handlePackageKitError));
                            }));
                        }));
                        this._pkgTransaction.GetUpdateDetailRemote(ids, Lang.bind(this, this._handlePackageKitError));
                    }));
                } else {
                    this._createUpdateMenuItems();
                    this._refreshMenuItem.disableProgress();
                    this._refreshRunning = false;
                    this._setUILocked(false);
                }
            }));
            this._pkgTransaction.GetUpdatesRemote("none", Lang.bind(this, this._handlePackageKitError));
        }));
        return true;
    },
	
    _actionUpdate : function() {
        this._setUILocked(true);
        this._updateMenuItem.enableProgress();

        this._startTransaction(Lang.bind(this, function() {
            this._pkgTransaction.connect('Finished', Lang.bind(this, function() {
                this._actionRefresh();
            }));
            this._pkgTransaction.RefreshCacheRemote(false, Lang.bind(this, this._handlePackageKitError));
        }));
    },
	
    _actionUpgrade : function() {
        this._setUILocked(true);
        this._upgradeMenuItem.enableProgress();

        this._startTransaction(Lang.bind(this, function() {
            this._pkgTransaction.connect('Finished', Lang.bind(this, function() {
                this._actionRefresh();
            }));
            this._pkgTransaction.UpdateSystemRemote(false, Lang.bind(this, this._handlePackageKitError));
        }));
    },
	
    _setUILocked : function(locked) {
        if(!locked) {
            this._refreshMenuItem.actor.remove_style_pseudo_class('disabled');
            this._updatesMenuItem.actor.remove_style_pseudo_class('disabled');
            this._updateMenuItem.actor.remove_style_pseudo_class('disabled');
            this._upgradeMenuItem.actor.remove_style_pseudo_class('disabled');
        } else {
            this._refreshMenuItem.actor.add_style_pseudo_class('disabled');
            this._updatesMenuItem.actor.add_style_pseudo_class('disabled');
            this._updateMenuItem.actor.add_style_pseudo_class('disabled');
            this._upgradeMenuItem.actor.add_style_pseudo_class('disabled');
        }
        this._refreshMenuItem.actor.reactive = !locked;
        this._updatesMenuItem.actor.reactive = !locked;
        this._updateMenuItem.actor.reactive = !locked;
        this._upgradeMenuItem.actor.reactive = !locked;
    },
	
    _onPackageUpdate: function(dummy, info, package_id, summary) {
        let id = package_id.split(';', 1)[0]
        this._updateItems[id] = {};
        this._updateItems[id]['info'] = info;   
        this._updateItems[id]['summary'] = summary;
        this._updateItems[id]['package_id'] = package_id;
    },
	
    _onDetails: function(dummy, package_id, license, group, detail, url, size) {
        let id = package_id.split(';', 1)[0];
        this._updateItems[id]['group'] = group;
        this._updateItems[id]['detail'] = detail;
        this._updateItems[id]['size'] = size;
    },
	
    _onUpdateDetail: function(dummy, package_id, update, obsolete, vendor_url, bugzilla_url, cve_url, restart, update_text, changelog, state, issued, updated) {
        let id = package_id.split(';', 1)[0];
        this._updateItems[id]['update_text'] = update_text;
        this._updateItems[id]['changelog'] = changelog;
    },
	
    _onChanged: function() {
        this._pkgTransaction.GetAllRemote(Lang.bind(this, function() {
            if(arguments[1] != null) {
                Main.notifyError("Error", arguments[1].message)
            } else if(Number(arguments[0]['Percentage']) < 101){
                if(arguments[0]['Status'] == "refresh-cache") {
                    this._updateMenuItem.setProgress(arguments[0]['Percentage']);
                } else if(arguments[0]['Status'] == "update-system") {
                    this._upgradeMenuItem.setProgress(arguments[0]['Percentage']);
                }
            }
        }));
    },
    
    _onProgress: function(dummy, id, status, percentage) {
    },
	
    _onErrorCode: function(dummy, code, details) {
        Main.notifyError("UpdateIndicator:", details);
    },
	
    _handlePackageKitError: function(error) {
        if(error) {
            Main.notifyError("UpdateIndicator", error.message);
        }
    },
	
    _createUpdateMenuItems: function() {
        let cnt = 0;
        for(key in this._updateItems) {
            cnt++;
            let val = this._updateItems[key];
            let item = new MyUI.TooltipPopupMenuItem(key.toString(), {activate:false});
            
            if("blocked" == val['info']) {
                item.actor.add_style_pseudo_class('blocked');
            }
            
            let tooltip = "%{summary}\n%{name} (Size: %{size} MiB)\nPriority: %{priority}\n\nChanges:\n%{changelog}\n\n%{text}";
            tooltip = tooltip.replace(/%{summary}/, val['summary']);
            tooltip = tooltip.replace(/%{name}/, key);
            tooltip = tooltip.replace(/%{priority}/, val['info']);
            tooltip = tooltip.replace(/%{changelog}/, val['changelog']);
            tooltip = tooltip.replace(/%{text}/, val['update_text']);

            let size = parseInt(val['size']);
            if(size != 0) {
                size = Math.round((size/(1024*1024))*100)/100.0;
            }
            tooltip = tooltip.replace(/%{size}/, String(size));
            item.setTooltipText(tooltip);
            this._updatesMenuItem.menu.addMenuItem(item);
        }
	    
        let label = cnt + " Updates";
        this._label.set_text(label);
        this._updatesMenuItem.label.set_text(label);
        if(cnt == 0 && this._settings.get_boolean('hide-if-none')) {
            this.actor.visible = false;
        } else {
            this.actor.visible = true;
        }
    },
	
    _addToPanel: function() {
        let order = this._settings.get_int('order')-1;
        switch (this._settings.get_enum('position-in-panel')) {
            case PanelPosition.LEFT:
                if(order == -1) {
                    Main.panel._leftBox.add(this.actor, {
                        y_fill: true
                    });
                } else {
                    Main.panel._leftBox.insert_actor(this.actor, order);
                }
                this._container = Main.panel._leftBox;
                break;
            case PanelPosition.CENTER:
                if(order == -1) {
                    Main.panel._centerBox.add(this.actor, {
                        y_fill: true
                    });
                } else {
                    Main.panel._centerBox.insert_actor(this.actor, order);
                }
                this._container = Main.panel._centerBox;
                break;
            case PanelPosition.RIGHT:
                if(order == -1) {
                    Main.panel._rightBox.add(this.actor, {
                        y_fill: true
                    });
                } else {
                    Main.panel._rightBox.insert_actor(this.actor, order);
                }
                this._container = Main.panel._rightBox;
                break;
        }
    },
	
    _removeFromPanel: function() {
        this._container.remove_actor(this.actor);
    },
	
    destroy: function() {
        this._stopTimeout();
        Main.panel._menus.removeMenu(this.menu);
        this._removeFromPanel();
        PanelMenu.Button.prototype.destroy.call(this);
    }
};

let updateButton;

function init() {
}

function disable() {
    updateButton.destroy();
    delete updateButton;
}

function enable() {
    updateButton = new UpdateButton();
}
