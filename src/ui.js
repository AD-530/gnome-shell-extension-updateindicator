const Lang      = imports.lang;
const Main      = imports.ui.main;
const Mainloop  = imports.mainloop;
const Panel     = imports.ui.panel;
const PopupMenu = imports.ui.popupMenu;
const St        = imports.gi.St;
const Tweener   = imports.ui.tweener;

function ProgressPopupMenuItem() {
    this._init.apply(this, arguments);
}

ProgressPopupMenuItem.prototype = {
    __proto__: PopupMenu.PopupBaseMenuItem.prototype,

    _init: function (text, params) {
        PopupMenu.PopupBaseMenuItem.prototype._init.call(this, params);

        this.label = new St.Label({
            text: text
        });
        this.progressLabel = new St.Label();
        this.progressLabel.hide();
        this.spinner = new Panel.AnimatedIcon('process-working.svg', Panel.PANEL_ICON_SIZE);
        this.spinner.actor.hide();
        this.addActor(this.label);
        this.addActor(this.progressLabel);
        this.addActor(this.spinner.actor);
    },
    
    enableProgress: function() {
        this.progress = 0;
        this.progressLabel.set_text("0%");
        this.spinner.actor.show();
    },
    
    disableProgress: function() {
        this.progressLabel.hide();
        Tweener.addTween(this.spinner.actor, {
            opacity: 0,
            time: Panel.SPINNER_ANIMATION_TIME,
            transition: "easeOutQuad",
            onCompleteScope: this,
            onComplete: function() {
                this.spinner.actor.opacity = 255;
                this.spinner.actor.hide();
            }
        });
    },
    
    setProgress: function(p) {
        this.progressLabel.show();
        if(Number(p) >= this.progress) {
            this.progressLabel.set_text(p+"%");
            this.progress = Number(p);
        }
    }
};

const TOOLTIP_LABEL_SHOW_TIME = 0.15;
const TOOLTIP_LABEL_HIDE_TIME = 0.1;
const TOOLTIP_HOVER_TIMEOUT = 300;

const TooltipPopupMenuItem = new Lang.Class({
    Name: 'TooltipPopupMenuItem',
    Extends: PopupMenu.PopupMenuItem,

    _init: function (text, params) {
        this.parent(text, params);
        
        this.labelTimeoutId = 0;
        this.tooltipLabel = new St.Label({
            style_class: 'tooltip-label'
        });
        Main.layoutManager.addChrome(this.tooltipLabel);
        this.tooltipLabel.hide();

        this.actor.connect('notify::hover', Lang.bind(this, function() {
            this.onHover();
        }));
    },

    setTooltipText: function(text) {
        this.tooltipLabel.set_text(text);
    },
    
    onHover: function() {
        if (this.actor.get_hover()) {
            if (this.labelTimeoutId == 0) {
                this.labelTimeoutId = Mainloop.timeout_add(TOOLTIP_HOVER_TIMEOUT, Lang.bind(this, function() {
                    this.showTooltip();
                    return false;
                }));
            }
        } else {
            if (this.labelTimeoutId > 0) {
                Mainloop.source_remove(this.labelTimeoutId);
            }
            this.labelTimeoutId = 0;
            this.hideTooltip();
        }
    },
    
    showTooltip: function() {
        this.tooltipLabel.opacity = 0;
        this.tooltipLabel.show();
 
        let [stageX, stageY] = this.actor.get_transformed_position();
 
        this.tooltipLabel.set_position(stageX+this.actor.get_width()+5, stageY);
        
        Tweener.addTween(this.tooltipLabel, {
            opacity: 255,
            time: TOOLTIP_LABEL_SHOW_TIME,
            transition: 'easeOutQuad'
        });
    },
 
    hideTooltip: function () {
        this.tooltipLabel.opacity = 255;
        Tweener.addTween(this.tooltipLabel, {
            opacity: 0,
            time: TOOLTIP_LABEL_HIDE_TIME,
            transition: 'easeOutQuad',
            onComplete: Lang.bind(this, function() {
                this.tooltipLabel.hide();
            })
        });
    }
});
