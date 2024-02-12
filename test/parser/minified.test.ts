import { expect, test, describe } from "vitest"
import { parseController } from "../helpers/parse"

describe("compiled JavaScript", () => {
  test("transpiled", () => {
    const code = `
      import { Controller as o } from "@hotwired/stimulus";

      class r extends o {
        initialize() {
          this.intersectionObserverCallback = this.intersectionObserverCallback.bind(this);
        }

        connect() {
          this.class = this.classValue || this.defaultOptions.class || "in", this.threshold = this.thresholdValue || this.defaultOptions.threshold || 0.1, this.rootMargin = this.rootMarginValue || this.defaultOptions.rootMargin || "0px", this.observer = new IntersectionObserver(this.intersectionObserverCallback, this.intersectionObserverOptions), this.itemTargets.forEach((t) => this.observer.observe(t));
        }

        disconnect() {
          this.itemTargets.forEach((t) => this.observer.unobserve(t));
        }
      }

      r.targets = ["item"];

      r.classes = ["active", "inactive"];

      r.values = {
        class: String,
        threshold: Number,
        rootMargin: String
      };

      export {
        r as default
      };
    `

    const controller = parseController(code, "minified_controller.js")

    expect(controller.hasErrors).toEqual(false)
    expect(controller.methods).toEqual(["initialize", "connect", "disconnect"])
    expect(controller.targets).toEqual(["item"])
    expect(controller.classes).toEqual(["active", "inactive"])
    expect(Object.keys(controller.values)).toEqual(["class", "threshold", "rootMargin"])
  })

  test.skip("transpiled/minified", () => {
    const code = `
      (function(e,t){typeof exports=="object"&&typeof module<"u"?module.exports=t(require("@hotwired/stimulus")):typeof define=="function"&&define.amd?define(["@hotwired/stimulus"],t):(e=typeof globalThis<"u"?globalThis:e||self,e.StimulusScrollReveal=t(e.Stimulus))})(this,function(e){"use strict";class t extends e.Controller{initialize(){this.intersectionObserverCallback=this.intersectionObserverCallback.bind(this)}connect(){this.class=this.classValue||this.defaultOptions.class||"in",this.threshold=this.thresholdValue||this.defaultOptions.threshold||.1,this.rootMargin=this.rootMarginValue||this.defaultOptions.rootMargin||"0px",this.observer=new IntersectionObserver(this.intersectionObserverCallback,this.intersectionObserverOptions),this.itemTargets.forEach(s=>this.observer.observe(s))}disconnect(){this.itemTargets.forEach(s=>this.observer.unobserve(s))}intersectionObserverCallback(s,o){s.forEach(r=>{if(r.intersectionRatio>this.threshold){const i=r.target;i.classList.add(...this.class.split(" ")),i.dataset.delay&&(i.style.transitionDelay=i.dataset.delay),o.unobserve(i)}})}get intersectionObserverOptions(){return{threshold:this.threshold,rootMargin:this.rootMargin}}get defaultOptions(){return{}}}return t.targets=["item"],t.values={class:String,threshold:Number,rootMargin:String},t});
    `

    const controller = parseController(code, "minified_controller.js")

    expect(controller.hasErrors).toEqual(false)
    expect(controller.methods).toEqual(["initialize", "connect", "disconnect", "intersectionObserverCallback"])
    expect(controller.classes).toEqual([])
    expect(controller.targets).toEqual(["item"])
    expect(Object.keys(controller.values)).toEqual(["class", "threshold", "rootMargin"])
  })
})
