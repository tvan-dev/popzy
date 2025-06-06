

Popzy.elements = []

function Popzy (options = {}) {
    if(!options.content && !options.templateId) {
        console.log("You must provide content or templateId");
        return;
    }
    if (options.content && options.templateId) {
        options.templateId = null
        console.warn("Both content and templateId are provided, using content only. templateId will be ignored.");
    }
    this.opt = Object.assign({ 
            closeMethod : ["buttonX", "overlay", "escape"], 
            destroyOnClose : true, 
            cssClass : [],
            footer : false,
            enableSrollLock: true,
            scrollLockTarget: () => document.body,
        },options);
    
    if(this.opt.templateId) {
        this.template = document.querySelector(`#${this.opt.templateId}`);

        if(!this.template) {
            console.error(`${this.opt.templateId} not found`);
            return;
        }
    }
    this.content = this.opt.content
    this._handleEscapeKey = this._handleEscapeKey.bind(this);

}

Popzy.prototype.getScrollbarWidth = function() {
        if(this._srollbarWidth) return this._srollbarWidth
        const div = document.createElement("div");
        Object.assign(div.style, {
            position: "absolute",
            top: "-9999px",
            overflow: "scroll",
        })

        document.body.appendChild(div);
        this._srollbarWidth = div.offsetWidth - div.clientWidth;
        // remove div after getting scrollbar width
        document.body.removeChild(div);
        return this._srollbarWidth;
}
Popzy.prototype.createModal = function () {
        // cloneNode chỉ copy được nội dung của phần tử, không copy  sự kiện handle của phần tử
        const contentNode = this.content ? document.createElement("div"): this.template.content.cloneNode(true)
        if(this.content) {
            contentNode.innerHTML = this.content;
        }
        this._backdrop = document.createElement("div");
        this._backdrop.className = "popzy__backdrop";

        this._container = document.createElement("div");
        this._container.className = "popzy__container";
        this._container.classList.add(...this.opt.cssClass);

        if(this.opt.closeMethod.includes("buttonX")) {
            const btnClose = this._createButton("&times;", ['popzy__close'], () => this.close())
            this._container.appendChild(btnClose);
        }

        const contents = document.createElement("div");
        contents.className = "popzy__content";
        
        contents.append(contentNode) // append nội dung của template vào modal-content
        this._container.appendChild(contents);

        if(this.opt.footer) {
            this._modalFooter = document.createElement("div");
            this._modalFooter.className = "popzy__footer";

            this._container.append(this._modalFooter);
        }

        this._backdrop.append(this._container);
        document.body.append(this._backdrop);
};

Popzy.prototype.setContent = function(content) {
    this.content = content;
    if(this._container) {
        this._container.innerHTML = this.content;
    }
};
Popzy.prototype.setFooterContent = function(htmlString) {
    if(htmlString) {
        this._modalFooter.innerHTML = htmlString;
    }
};

Popzy.prototype.setFooterButton = function (text, cssArray=[], callback) {
    const button = this._createButton(text, cssArray, callback)
    this._modalFooter.appendChild(button)
    
};

Popzy.prototype._handleEscapeKey = function (e) {
    const lastModal = Popzy.elements[Popzy.elements.length -1]
    if(e.key === "Escape" && lastModal === this) {
        this.close()
    }
}

Popzy.prototype._onTransitionEnd = function (callback) {
    this._backdrop.ontransitionend = (e) => {
        if(e.propertyName === "transform") return;
        if(typeof callback === "function") callback();
    }
};

Popzy.prototype._createButton = function(text, cssArray=[], callback)  {
    if (text) {
        const button = document.createElement("button")
        button.innerHTML = text
        button.classList.add(...cssArray)
        button.onclick = callback
        return button
    }
}

Popzy.prototype.open = function() {
    Popzy.elements.push(this)
    if(!this._backdrop) {
        this.createModal();
    }
    setTimeout(() => {
        this._backdrop.classList.add("popzy--show");
    },0)

    if(this.opt.closeMethod.includes("overlay")) {
        this._backdrop.onclick =  (e) =>{
            if(e.target === this._backdrop) {
                this.close()
            }
        }
    }

    if (this.opt.closeMethod.includes("escape")) {
        document.addEventListener("keydown", this._handleEscapeKey)
    }
    
    //Disable scroll
    if(this.opt.enableSrollLock) {
        const target = this.opt.scrollLockTarget();
        if(this._hasScrollbar(target)) {
            target.classList.add("no-scroll")
            const targetPadRight = parseInt(getComputedStyle(target).paddingRight);
            target.style.paddingRight = targetPadRight + this.getScrollbarWidth() + "px"
        }
    }
    
    this._onTransitionEnd(this.opt.onOpen)

    return this._backdrop
};
Popzy.prototype._hasScrollbar = function(target) {
    if([document.documentElement, document.body].includes(target)) {
        return document.documentElement.scrollHeight > document.documentElement.clientHeight || document.body.scrollHeight > document.body.clientHeight;
    }
    return target.scrollHeight > target.clientHeight;

}
Popzy.prototype.close = function(destroy = this.opt.destroyOnClose) {
    Popzy.elements.pop()
    if (this.opt.closeMethod.includes("escape")) {
        document.removeEventListener("keydown", this._handleEscapeKey)
    }
    this._backdrop.classList.remove("popzy--show");
    this._onTransitionEnd(() => {
        if(this._backdrop && destroy) {
            this._backdrop.remove(); 
            this._backdrop = null;
            this._modalFooter = null;
        }
        if(typeof this.opt.onClose === "function") this.opt.onClose() 
    })
    
    //Enable scroll
    if(this.opt.enableSrollLock && Popzy.elements.length === 0) {
        const target = this.opt.scrollLockTarget();
        const targetPadRight = parseInt(getComputedStyle(target).paddingRight);
        if(this._hasScrollbar(target)) {
            target.classList.remove("no-scroll")

            target.style.paddingRight = targetPadRight - this.getScrollbarWidth() + "px"
        }
        
    }
    
    
};

Popzy.prototype.destroy = function() {
    this.close(true)
}
