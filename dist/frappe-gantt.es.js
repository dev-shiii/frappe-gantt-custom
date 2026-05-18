const H = "year", C = "month", W = "day", q = "hour", F = "minute", I = "second", j = "millisecond", c = {
  parse_duration(r) {
    const e = /([0-9]+)(y|m|d|h|min|s|ms)/gm.exec(r);
    if (e !== null) {
      if (e[2] === "y")
        return { duration: parseInt(e[1]), scale: "year" };
      if (e[2] === "m")
        return { duration: parseInt(e[1]), scale: "month" };
      if (e[2] === "d")
        return { duration: parseInt(e[1]), scale: "day" };
      if (e[2] === "h")
        return { duration: parseInt(e[1]), scale: "hour" };
      if (e[2] === "min")
        return { duration: parseInt(e[1]), scale: "minute" };
      if (e[2] === "s")
        return { duration: parseInt(e[1]), scale: "second" };
      if (e[2] === "ms")
        return { duration: parseInt(e[1]), scale: "millisecond" };
    }
  },
  parse(r, t = "-", e = /[.:]/) {
    if (r instanceof Date)
      return r;
    if (typeof r == "string") {
      let i, s;
      const n = r.split(" ");
      i = n[0].split(t).map((a) => parseInt(a, 10)), s = n[1] && n[1].split(e), i[1] = i[1] ? i[1] - 1 : 0;
      let o = i;
      return s && s.length ? (s.length === 4 && (s[3] = "0." + s[3], s[3] = parseFloat(s[3]) * 1e3), o = o.concat(s)) : o = o.concat([0, 0, 0, 0]), new Date(...o);
    }
  },
  to_string(r, t = !1) {
    if (!(r instanceof Date))
      throw new TypeError("Invalid argument type");
    const e = this.get_date_values(r).map((n, o) => (o === 1 && (n = n + 1), o === 6 ? E(n + "", 3, "0") : E(n + "", 2, "0"))), i = `${e[0]}-${e[1]}-${e[2]}`, s = `${e[3]}:${e[4]}:${e[5]}.${e[6]}`;
    return i + (t ? " " + s : "");
  },
  format(r, t = "YYYY-MM-DD HH:mm:ss.SSS", e = "en") {
    const i = new Intl.DateTimeFormat(e, {
      month: "long"
    }), s = new Intl.DateTimeFormat(e, {
      month: "short"
    }), n = i.format(r), o = n.charAt(0).toUpperCase() + n.slice(1), a = this.get_date_values(r).map((l) => E(l, 2, 0)), d = {
      YYYY: a[0],
      MM: E(+a[1] + 1, 2, 0),
      DD: a[2],
      HH: a[3],
      mm: a[4],
      ss: a[5],
      SSS: a[6],
      D: a[2],
      MMMM: o,
      MMM: s.format(r)
    };
    let h = t;
    const _ = [];
    return Object.keys(d).sort((l, g) => g.length - l.length).forEach((l) => {
      h.includes(l) && (h = h.replaceAll(l, `$${_.length}`), _.push(d[l]));
    }), _.forEach((l, g) => {
      h = h.replaceAll(`$${g}`, l);
    }), h;
  },
  diff(r, t, e = "day") {
    let i, s, n, o, a, d, h;
    i = r - t + (t.getTimezoneOffset() - r.getTimezoneOffset()) * 6e4, s = i / 1e3, o = s / 60, n = o / 60, a = n / 24;
    let _ = r.getFullYear() - t.getFullYear(), l = r.getMonth() - t.getMonth();
    return l += r.getDate() / 31, d = _ * 12 + l, r.getDate() < t.getDate() && d--, h = d / 12, e.endsWith("s") || (e += "s"), Math.round(
      {
        milliseconds: i,
        seconds: s,
        minutes: o,
        hours: n,
        days: a,
        months: d,
        years: h
      }[e] * 100
    ) / 100;
  },
  today() {
    const r = this.get_date_values(/* @__PURE__ */ new Date()).slice(0, 3);
    return new Date(...r);
  },
  now() {
    return /* @__PURE__ */ new Date();
  },
  add(r, t, e) {
    t = parseInt(t, 10);
    const i = [
      r.getFullYear() + (e === H ? t : 0),
      r.getMonth() + (e === C ? t : 0),
      r.getDate() + (e === W ? t : 0),
      r.getHours() + (e === q ? t : 0),
      r.getMinutes() + (e === F ? t : 0),
      r.getSeconds() + (e === I ? t : 0),
      r.getMilliseconds() + (e === j ? t : 0)
    ];
    return new Date(...i);
  },
  start_of(r, t) {
    const e = {
      [H]: 6,
      [C]: 5,
      [W]: 4,
      [q]: 3,
      [F]: 2,
      [I]: 1,
      [j]: 0
    };
    function i(n) {
      const o = e[t];
      return e[n] <= o;
    }
    const s = [
      r.getFullYear(),
      i(H) ? 0 : r.getMonth(),
      i(C) ? 1 : r.getDate(),
      i(W) ? 0 : r.getHours(),
      i(q) ? 0 : r.getMinutes(),
      i(F) ? 0 : r.getSeconds(),
      i(I) ? 0 : r.getMilliseconds()
    ];
    return new Date(...s);
  },
  clone(r) {
    return new Date(...this.get_date_values(r));
  },
  get_date_values(r) {
    return [
      r.getFullYear(),
      r.getMonth(),
      r.getDate(),
      r.getHours(),
      r.getMinutes(),
      r.getSeconds(),
      r.getMilliseconds()
    ];
  },
  get_utc_date_values(r) {
    return [
      r.getUTCFullYear(),
      r.getUTCMonth(),
      r.getUTCDate(),
      r.getUTCHours(),
      r.getUTCMinutes(),
      r.getUTCSeconds(),
      r.getUTCMilliseconds()
    ];
  },
  convert_scales(r, t) {
    const e = {
      millisecond: 11574074074074074e-24,
      second: 11574074074074073e-21,
      minute: 6944444444444445e-19,
      hour: 0.041666666666666664,
      day: 1,
      month: 30,
      year: 365
    }, { duration: i, scale: s } = this.parse_duration(r);
    return i * e[s] / e[t];
  },
  get_days_in_month(r) {
    const t = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], e = r.getMonth();
    if (e !== 1)
      return t[e];
    const i = r.getFullYear();
    return i % 4 === 0 && i % 100 != 0 || i % 400 === 0 ? 29 : 28;
  },
  get_days_in_year(r) {
    return r.getFullYear() % 4 ? 365 : 366;
  }
};
function E(r, t, e) {
  return r = r + "", t = t >> 0, e = String(typeof e < "u" ? e : " "), r.length > t ? String(r) : (t = t - r.length, t > e.length && (e += e.repeat(t / e.length)), e.slice(0, t) + String(r));
}
function p(r, t) {
  return typeof r == "string" ? (t || document).querySelector(r) : r || null;
}
function u(r, t) {
  const e = document.createElementNS("http://www.w3.org/2000/svg", r);
  for (let i in t)
    i === "append_to" ? t.append_to.appendChild(e) : i === "innerHTML" ? e.innerHTML = t.innerHTML : i === "clipPath" ? e.setAttribute("clip-path", "url(#" + t[i] + ")") : e.setAttribute(i, t[i]);
  return e;
}
function O(r, t, e, i) {
  const s = B(r, t, e, i);
  if (s === r) {
    const n = document.createEvent("HTMLEvents");
    n.initEvent("click", !0, !0), n.eventName = "click", s.dispatchEvent(n);
  }
}
function B(r, t, e, i, s = "0.4s", n = "0.1s") {
  const o = r.querySelector("animate");
  if (o)
    return p.attr(o, {
      attributeName: t,
      from: e,
      to: i,
      dur: s,
      begin: "click + " + n
      // artificial click
    }), r;
  const a = u("animate", {
    attributeName: t,
    from: e,
    to: i,
    dur: s,
    begin: n,
    calcMode: "spline",
    values: e + ";" + i,
    keyTimes: "0; 1",
    keySplines: N("ease-out")
  });
  return r.appendChild(a), r;
}
function N(r) {
  return {
    ease: ".25 .1 .25 1",
    linear: "0 0 1 1",
    "ease-in": ".42 0 1 1",
    "ease-out": "0 0 .58 1",
    "ease-in-out": ".42 0 .58 1"
  }[r];
}
p.on = (r, t, e, i) => {
  i ? p.delegate(r, t, e, i) : (i = e, p.bind(r, t, i));
};
p.off = (r, t, e) => {
  r.removeEventListener(t, e);
};
p.bind = (r, t, e) => {
  t.split(/\s+/).forEach(function(i) {
    r.addEventListener(i, e);
  });
};
p.delegate = (r, t, e, i) => {
  r.addEventListener(t, function(s) {
    const n = s.target.closest(e);
    n && (s.delegatedTarget = n, i.call(this, s, n));
  });
};
p.closest = (r, t) => t ? t.matches(r) ? t : p.closest(r, t.parentNode) : null;
p.attr = (r, t, e) => {
  if (!e && typeof t == "string")
    return r.getAttribute(t);
  if (typeof t == "object") {
    for (let i in t)
      p.attr(r, i, t[i]);
    return;
  }
  r.setAttribute(t, e);
};
class U {
  constructor(t, e, i) {
    this.gantt = t, this.from_task = e, this.to_task = i, this.calculate_path(), this.draw();
  }
  calculate_path() {
    const t = this.from_task.task._row !== void 0 ? this.from_task.task._row : this.from_task.task._index, e = this.to_task.task._row !== void 0 ? this.to_task.task._row : this.to_task.task._index;
    let i = this.from_task.$bar.getX() + this.from_task.$bar.getWidth() / 2;
    const s = () => this.to_task.$bar.getX() < i + this.gantt.options.padding && i > this.from_task.$bar.getX() + this.gantt.options.padding;
    for (; s(); )
      i -= 10;
    i -= 10;
    let n = this.gantt.config.header_height + this.gantt.options.bar_height + (this.gantt.options.padding + this.gantt.options.bar_height) * t + // <-- was this.from_task.task._index
    this.gantt.options.padding / 2, o = this.to_task.$bar.getX() - 13, a = this.gantt.config.header_height + this.gantt.options.bar_height / 2 + (this.gantt.options.padding + this.gantt.options.bar_height) * e + // <-- was this.to_task.task._index
    this.gantt.options.padding / 2;
    const d = t > e;
    let h = this.gantt.options.arrow_curve;
    const _ = d ? 1 : 0;
    let l = d ? -h : h;
    if (this.to_task.$bar.getX() <= this.from_task.$bar.getX() + this.gantt.options.padding) {
      let g = this.gantt.options.padding / 2 - h;
      g < 0 && (g = 0, h = this.gantt.options.padding / 2, l = d ? -h : h);
      const f = this.to_task.$bar.getY() + this.to_task.$bar.getHeight() / 2 - l, m = this.to_task.$bar.getX() - this.gantt.options.padding;
      this.path = `
                M ${i} ${n}
                v ${g}
                a ${h} ${h} 0 0 1 ${-h} ${h}
                H ${m}
                a ${h} ${h} 0 0 ${_} ${-h} ${l}
                V ${f}
                a ${h} ${h} 0 0 ${_} ${h} ${l}
                L ${o} ${a}
                m -5 -5
                l 5 5
                l -5 5`;
    } else {
      o < i + h && (h = o - i);
      let g = d ? a + h : a - h;
      this.path = `
              M ${i} ${n}
              V ${g}
              a ${h} ${h} 0 0 ${_} ${h} ${h}
              L ${o} ${a}
              m -5 -5
              l 5 5
              l -5 5`;
    }
  }
  draw() {
    this.element = u("path", {
      d: this.path,
      "data-from": this.from_task.task.id,
      "data-to": this.to_task.task.id
    });
  }
  update() {
    this.calculate_path(), this.element.setAttribute("d", this.path);
  }
}
class V {
  constructor(t, e) {
    this.set_defaults(t, e), this.prepare_wrappers(), this.prepare_helpers(), this.refresh();
  }
  refresh() {
    this.bar_group.innerHTML = "", this.handle_group.innerHTML = "", this.task.custom_class ? this.group.classList.add(this.task.custom_class) : this.group.classList = ["bar-wrapper"], this.prepare_values(), this.draw(), this.bind();
  }
  set_defaults(t, e) {
    this.action_completed = !1, this.gantt = t, this.task = e, this.name = this.name || "";
  }
  prepare_wrappers() {
    this.group = u("g", {
      class: "bar-wrapper" + (this.task.custom_class ? " " + this.task.custom_class : ""),
      "data-id": this.task.id
    }), this.bar_group = u("g", {
      class: "bar-group",
      append_to: this.group
    }), this.handle_group = u("g", {
      class: "handle-group",
      append_to: this.group
    });
  }
  prepare_values() {
    this.invalid = this.task.invalid, this.height = this.gantt.options.bar_height, this.image_size = this.height - 5, this.task._start || (this.task._start = new Date(this.task.start)), this.task._end || (this.task._end = new Date(this.task.end)), this.compute_x(), this.compute_y(), this.compute_duration(), this.corner_radius = this.gantt.options.bar_corner_radius, this.width = this.gantt.config.column_width * this.duration, (!this.task.progress || this.task.progress < 0) && (this.task.progress = 0), this.task.progress > 100 && (this.task.progress = 100);
  }
  prepare_helpers() {
    SVGElement.prototype.getX = function() {
      return +this.getAttribute("x");
    }, SVGElement.prototype.getY = function() {
      return +this.getAttribute("y");
    }, SVGElement.prototype.getWidth = function() {
      return +this.getAttribute("width");
    }, SVGElement.prototype.getHeight = function() {
      return +this.getAttribute("height");
    }, SVGElement.prototype.getEndX = function() {
      return this.getX() + this.getWidth();
    };
  }
  prepare_expected_progress_values() {
    this.compute_expected_progress(), this.expected_progress_width = this.gantt.options.column_width * this.duration * (this.expected_progress / 100) || 0;
  }
  draw() {
    this.draw_bar(), this.draw_progress_bar(), this.gantt.options.show_expected_progress && (this.prepare_expected_progress_values(), this.draw_expected_progress_bar()), this.task.done && this.gantt.options.pack_done_tasks || this.draw_label(), this.draw_resize_handles(), this.task.thumbnail && this.draw_thumbnail();
  }
  draw_bar() {
    this.$bar = u("rect", {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      rx: this.corner_radius,
      ry: this.corner_radius,
      class: "bar",
      append_to: this.bar_group
    }), this.task.color && (this.$bar.style.fill = this.task.color), O(this.$bar, "width", 0, this.width), this.invalid && this.$bar.classList.add("bar-invalid");
  }
  draw_expected_progress_bar() {
    this.invalid || (this.$expected_bar_progress = u("rect", {
      x: this.x,
      y: this.y,
      width: this.expected_progress_width,
      height: this.height,
      rx: this.corner_radius,
      ry: this.corner_radius,
      class: "bar-expected-progress",
      append_to: this.bar_group
    }), O(
      this.$expected_bar_progress,
      "width",
      0,
      this.expected_progress_width
    ));
  }
  draw_progress_bar() {
    if (this.invalid)
      return;
    this.progress_width = this.calculate_progress_width();
    let t = this.corner_radius;
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || (t = this.corner_radius + 2), this.$bar_progress = u("rect", {
      x: this.x,
      y: this.y,
      width: this.progress_width,
      height: this.height,
      rx: t,
      ry: t,
      class: "bar-progress",
      append_to: this.bar_group
    }), this.task.color_progress && (this.$bar_progress.style.fill = this.task.color_progress);
    const e = c.diff(
      this.task._start,
      this.gantt.gantt_start,
      this.gantt.config.unit
    ) / this.gantt.config.step * this.gantt.config.column_width;
    let i = this.gantt.create_el({
      classes: `date-range-highlight hide highlight-${this.task.id}`,
      width: this.width,
      left: e
    });
    this.$date_highlight = i, this.gantt.$lower_header.prepend(this.$date_highlight), O(this.$bar_progress, "width", 0, this.progress_width);
  }
  calculate_progress_width() {
    const t = this.$bar.getWidth(), e = this.x + t, i = this.gantt.config.ignored_positions.reduce((d, h) => d + (h >= this.x && h < e), 0) * this.gantt.config.column_width;
    let s = (t - i) * this.task.progress / 100;
    const n = this.x + s, o = this.gantt.config.ignored_positions.reduce((d, h) => d + (h >= this.x && h < n), 0) * this.gantt.config.column_width;
    s += o;
    let a = this.gantt.get_ignored_region(
      this.x + s
    );
    for (; a.length; )
      s += this.gantt.config.column_width, a = this.gantt.get_ignored_region(
        this.x + s
      );
    return this.progress_width = s, s;
  }
  draw_label() {
    let t = this.x + this.$bar.getWidth() / 2;
    this.task.thumbnail && (t = this.x + this.image_size + 5), u("text", {
      x: t,
      y: this.y + this.height / 2,
      innerHTML: this.task.name,
      class: "bar-label",
      append_to: this.bar_group
    }), requestAnimationFrame(() => this.update_label_position());
  }
  draw_thumbnail() {
    let t = 10, e = 2, i, s;
    i = u("defs", {
      append_to: this.bar_group
    }), u("rect", {
      id: "rect_" + this.task.id,
      x: this.x + t,
      y: this.y + e,
      width: this.image_size,
      height: this.image_size,
      rx: "15",
      class: "img_mask",
      append_to: i
    }), s = u("clipPath", {
      id: "clip_" + this.task.id,
      append_to: i
    }), u("use", {
      href: "#rect_" + this.task.id,
      append_to: s
    }), u("image", {
      x: this.x + t,
      y: this.y + e,
      width: this.image_size,
      height: this.image_size,
      class: "bar-img",
      href: this.task.thumbnail,
      clipPath: "clip_" + this.task.id,
      append_to: this.bar_group
    });
  }
  draw_resize_handles() {
    if (this.invalid || this.gantt.options.readonly)
      return;
    const t = this.$bar, e = 3;
    if (this.handles = [], !this.gantt.options.readonly_dates && !this.gantt.options.fixed_duration && (this.handles.push(
      u("rect", {
        x: t.getEndX() - e / 2,
        y: t.getY() + this.height / 4,
        width: e,
        height: this.height / 2,
        rx: 2,
        ry: 2,
        class: "handle right",
        append_to: this.handle_group
      })
    ), this.handles.push(
      u("rect", {
        x: t.getX() - e / 2,
        y: t.getY() + this.height / 4,
        width: e,
        height: this.height / 2,
        rx: 2,
        ry: 2,
        class: "handle left",
        append_to: this.handle_group
      })
    )), !this.gantt.options.readonly_progress) {
      const i = this.$bar_progress;
      this.$handle_progress = u("circle", {
        cx: i.getEndX(),
        cy: i.getY() + i.getHeight() / 2,
        r: 4.5,
        class: "handle progress",
        append_to: this.handle_group
      }), this.handles.push(this.$handle_progress);
    }
    for (let i of this.handles)
      p.on(i, "mouseenter", () => i.classList.add("active")), p.on(i, "mouseleave", () => i.classList.remove("active"));
  }
  bind() {
    this.invalid || this.setup_click_event();
  }
  setup_click_event() {
    let t = this.task.id;
    p.on(this.group, "mouseover", (s) => {
      this.gantt.trigger_event("hover", [
        this.task,
        s.screenX,
        s.screenY,
        s
      ]);
    }), this.gantt.options.popup_on === "click" && p.on(this.group, "mouseup", (s) => {
      const n = s.offsetX || s.layerX;
      if (this.$handle_progress) {
        const o = +this.$handle_progress.getAttribute("cx");
        if (o > n - 1 && o < n + 1 || this.gantt.bar_being_dragged)
          return;
      }
      this.gantt.show_popup({
        x: s.offsetX || s.layerX,
        y: s.offsetY || s.layerY,
        task: this.task,
        target: this.$bar
      });
    });
    let e;
    p.on(this.group, "mouseenter", (s) => {
      e = setTimeout(() => {
        const n = this.task.done && this.gantt.options.pack_done_tasks;
        (this.gantt.options.popup_on === "hover" || n) && this.gantt.show_popup({
          x: s.offsetX || s.layerX,
          y: s.offsetY || s.layerY,
          task: this.task,
          target: this.$bar
        }), this.gantt.$container.querySelector(`.highlight-${t}`).classList.remove("hide");
      }, 200);
    }), p.on(this.group, "mouseleave", () => {
      var n, o;
      clearTimeout(e);
      const s = this.task.done && this.gantt.options.pack_done_tasks;
      (this.gantt.options.popup_on === "hover" || s) && ((o = (n = this.gantt.popup) == null ? void 0 : n.hide) == null || o.call(n)), this.gantt.$container.querySelector(`.highlight-${t}`).classList.add("hide");
    }), p.on(this.group, "click", () => {
      this.action_completed || this.gantt.trigger_event("click", [this.task]);
    }), p.on(this.group, "dblclick", (s) => {
      this.action_completed || (this.group.classList.remove("active"), this.gantt.popup && this.gantt.popup.parent.classList.remove("hide"), this.gantt.trigger_event("double_click", [this.task]));
    });
    let i = !1;
    p.on(this.group, "touchstart", (s) => {
      if (!i)
        return i = !0, setTimeout(function() {
          i = !1;
        }, 300), !1;
      s.preventDefault(), !this.action_completed && (this.group.classList.remove("active"), this.gantt.popup && this.gantt.popup.parent.classList.remove("hide"), this.gantt.trigger_event("double_click", [this.task]));
    });
  }
  update_bar_position({ x: t = null, width: e = null }) {
    const i = this.$bar;
    t && (this.update_attr(i, "x", t), this.x = t, this.$date_highlight.style.left = t + "px"), e > 0 && (this.update_attr(i, "width", e), this.$date_highlight.style.width = e + "px"), this.update_label_position(), this.update_handle_position(), this.date_changed(), this.compute_duration(), this.gantt.options.show_expected_progress && this.update_expected_progressbar_position(), this.update_progressbar_position(), this.update_arrow_position();
  }
  update_label_position_on_horizontal_scroll({ x: t, sx: e }) {
    const i = this.group.querySelector(".bar-label");
    if (!i)
      return;
    const s = this.gantt.$container, n = this.group.querySelector(".bar-img") || "", o = this.bar_group.querySelector(".img_mask") || "";
    let a = this.$bar.getX() + this.$bar.getWidth(), d = i.getX() + t, h = n && n.getX() + t || 0, _ = n && n.getBBox().width + 7 || 7, l = d + i.getBBox().width + 7, g = e + s.clientWidth / 2;
    i.classList.contains("big") || (l < a && t > 0 && l < g || d - _ > this.$bar.getX() && t < 0 && l > g) && (i.setAttribute("x", d), n && (n.setAttribute("x", h), o.setAttribute("x", h)));
  }
  date_changed() {
    let t = !1;
    const { new_start_date: e, new_end_date: i } = this.compute_start_end_date();
    Number(this.task._start) !== Number(e) && (t = !0, this.task._start = e), Number(this.task._end) !== Number(i) && (t = !0, this.task._end = i), t && this.gantt.trigger_event("date_change", [
      this.task,
      e,
      c.add(i, -1, "second")
    ]);
  }
  progress_changed() {
    this.task.progress = this.compute_progress(), this.gantt.trigger_event("progress_change", [
      this.task,
      this.task.progress
    ]);
  }
  set_action_completed() {
    this.action_completed = !0, setTimeout(() => this.action_completed = !1, 1e3);
  }
  compute_start_end_date() {
    const t = this.$bar, e = t.getX() / this.gantt.config.column_width;
    let i = c.add(
      this.gantt.gantt_start,
      e * this.gantt.config.step,
      this.gantt.config.unit
    );
    const s = t.getWidth() / this.gantt.config.column_width, n = c.add(
      i,
      s * this.gantt.config.step,
      this.gantt.config.unit
    );
    return { new_start_date: i, new_end_date: n };
  }
  compute_progress() {
    this.progress_width = this.$bar_progress.getWidth(), this.x = this.$bar_progress.getBBox().x;
    const t = this.x + this.progress_width, e = this.progress_width - this.gantt.config.ignored_positions.reduce((s, n) => s + (n >= this.x && n <= t), 0) * this.gantt.config.column_width;
    if (e < 0)
      return 0;
    const i = this.$bar.getWidth() - this.ignored_duration_raw * this.gantt.config.column_width;
    return parseInt(e / i * 100, 10);
  }
  compute_expected_progress() {
    this.expected_progress = c.diff(c.today(), this.task._start, "hour") / this.gantt.config.step, this.expected_progress = (this.expected_progress < this.duration ? this.expected_progress : this.duration) * 100 / this.duration;
  }
  compute_x() {
    const { column_width: t } = this.gantt.config, e = this.task._start, i = this.gantt.gantt_start;
    let n = c.diff(e, i, this.gantt.config.unit) / this.gantt.config.step * t;
    this.x = n;
  }
  compute_y() {
    const t = this.task._row !== void 0 ? this.task._row : this.task._index;
    this.y = this.gantt.config.header_height + this.gantt.options.padding / 2 + t * (this.height + this.gantt.options.padding);
  }
  compute_duration() {
    let t = 0, e = 0;
    for (let i = new Date(this.task._start); i < this.task._end; i.setDate(i.getDate() + 1))
      e++, !this.gantt.config.ignored_dates.find(
        (s) => s.getTime() === i.getTime()
      ) && (!this.gantt.config.ignored_function || !this.gantt.config.ignored_function(i)) && t++;
    this.task.actual_duration = t, this.task.ignored_duration = e - t, this.duration = c.convert_scales(
      e + "d",
      this.gantt.config.unit
    ) / this.gantt.config.step, this.actual_duration_raw = c.convert_scales(
      t + "d",
      this.gantt.config.unit
    ) / this.gantt.config.step, this.ignored_duration_raw = this.duration - this.actual_duration_raw;
  }
  update_attr(t, e, i) {
    return i = +i, isNaN(i) || t.setAttribute(e, i), t;
  }
  update_expected_progressbar_position() {
    this.invalid || (this.$expected_bar_progress.setAttribute("x", this.$bar.getX()), this.compute_expected_progress(), this.$expected_bar_progress.setAttribute(
      "width",
      this.gantt.config.column_width * this.actual_duration_raw * (this.expected_progress / 100) || 0
    ));
  }
  update_progressbar_position() {
    this.invalid || this.gantt.options.readonly || (this.$bar_progress.setAttribute("x", this.$bar.getX()), this.$bar_progress.setAttribute(
      "width",
      this.calculate_progress_width()
    ));
  }
  update_label_position() {
    const t = this.group.querySelector(".bar-label");
    if (!t)
      return;
    const e = this.bar_group.querySelector(".img_mask") || "", i = this.$bar, s = this.group.querySelector(".bar-img");
    let n = 5, o = this.image_size + 10;
    const a = t.getBBox().width, d = i.getWidth();
    a > d ? (t.classList.add("big"), s ? (s.setAttribute("x", i.getEndX() + n), e.setAttribute("x", i.getEndX() + n), t.setAttribute("x", i.getEndX() + o)) : t.setAttribute("x", i.getEndX() + n)) : (t.classList.remove("big"), s ? (s.setAttribute("x", i.getX() + n), e.setAttribute("x", i.getX() + n), t.setAttribute(
      "x",
      i.getX() + d / 2 + o
    )) : t.setAttribute(
      "x",
      i.getX() + d / 2 - a / 2
    ));
  }
  update_handle_position() {
    if (this.invalid || this.gantt.options.readonly)
      return;
    const t = this.$bar;
    this.handle_group.querySelector(".handle.left").setAttribute("x", t.getX()), this.handle_group.querySelector(".handle.right").setAttribute("x", t.getEndX());
    const e = this.group.querySelector(".handle.progress");
    e && e.setAttribute("cx", this.$bar_progress.getEndX());
  }
  update_arrow_position() {
    this.arrows = this.arrows || [];
    for (let t of this.arrows)
      t.update();
  }
}
class G {
  constructor(t, e, i) {
    this.parent = t, this.popup_func = e, this.gantt = i, this.make();
  }
  make() {
    this.parent.innerHTML = `
            <div class="title"></div>
            <div class="subtitle"></div>
            <div class="details"></div>
            <div class="actions"></div>
        `, this.hide(), this.title = this.parent.querySelector(".title"), this.subtitle = this.parent.querySelector(".subtitle"), this.details = this.parent.querySelector(".details"), this.actions = this.parent.querySelector(".actions");
  }
  show({ x: t, y: e, task: i, target: s }) {
    this.actions.innerHTML = "";
    let n = this.popup_func({
      task: i,
      chart: this.gantt,
      get_title: () => this.title,
      set_title: (o) => this.title.innerHTML = o,
      get_subtitle: () => this.subtitle,
      set_subtitle: (o) => this.subtitle.innerHTML = o,
      get_details: () => this.details,
      set_details: (o) => this.details.innerHTML = o,
      add_action: (o, a) => {
        let d = this.gantt.create_el({
          classes: "action-btn",
          type: "button",
          append_to: this.actions
        });
        typeof o == "function" && (o = o(i)), d.innerHTML = o, d.onclick = (h) => a(i, this.gantt, h);
      }
    });
    n !== !1 && (n && (this.parent.innerHTML = n), this.actions.innerHTML === "" ? this.actions.remove() : this.parent.appendChild(this.actions), this.parent.style.left = t + 10 + "px", this.parent.style.top = e - 10 + "px", this.parent.classList.remove("hide"));
  }
  hide() {
    this.parent.classList.add("hide");
  }
}
function z(r) {
  const t = r.getFullYear();
  return t - t % 10 + "";
}
function P(r, t, e) {
  let i = c.add(r, 6, "day"), s = i.getMonth() !== r.getMonth() ? "D MMM" : "D", n = !t || r.getMonth() !== t.getMonth() ? "D MMM" : "D";
  return `${c.format(r, n, e)} - ${c.format(i, s, e)}`;
}
const v = [
  {
    name: "Hour",
    padding: "7d",
    step: "1h",
    date_format: "YYYY-MM-DD HH:",
    lower_text: "HH",
    upper_text: (r, t, e) => !t || r.getDate() !== t.getDate() ? c.format(r, "D MMMM", e) : "",
    upper_text_frequency: 24
  },
  {
    name: "Quarter Day",
    padding: "7d",
    step: "6h",
    date_format: "YYYY-MM-DD HH:",
    lower_text: "HH",
    upper_text: (r, t, e) => !t || r.getDate() !== t.getDate() ? c.format(r, "D MMM", e) : "",
    upper_text_frequency: 4
  },
  {
    name: "Half Day",
    padding: "14d",
    step: "12h",
    date_format: "YYYY-MM-DD HH:",
    lower_text: "HH",
    upper_text: (r, t, e) => !t || r.getDate() !== t.getDate() ? r.getMonth() !== r.getMonth() ? c.format(r, "D MMM", e) : c.format(r, "D", e) : "",
    upper_text_frequency: 2
  },
  {
    name: "Day",
    padding: "7d",
    date_format: "YYYY-MM-DD",
    step: "1d",
    lower_text: (r, t, e) => !t || r.getDate() !== t.getDate() ? c.format(r, "D", e) : "",
    upper_text: (r, t, e) => !t || r.getMonth() !== t.getMonth() ? c.format(r, "MMMM", e) : "",
    thick_line: (r) => r.getDay() === 1
  },
  {
    name: "Week",
    padding: "1m",
    step: "7d",
    date_format: "YYYY-MM-DD",
    column_width: 140,
    lower_text: P,
    upper_text: (r, t, e) => !t || r.getMonth() !== t.getMonth() ? c.format(r, "MMMM", e) : "",
    thick_line: (r) => r.getDate() >= 1 && r.getDate() <= 7,
    upper_text_frequency: 4
  },
  {
    name: "Month",
    padding: "2m",
    step: "1m",
    column_width: 120,
    date_format: "YYYY-MM",
    lower_text: "MMMM",
    upper_text: (r, t, e) => !t || r.getFullYear() !== t.getFullYear() ? c.format(r, "YYYY", e) : "",
    thick_line: (r) => r.getMonth() % 3 === 0,
    snap_at: "7d"
  },
  {
    name: "Year",
    padding: "2y",
    step: "1y",
    column_width: 120,
    date_format: "YYYY",
    upper_text: (r, t, e) => !t || z(r) !== z(t) ? z(r) : "",
    lower_text: "YYYY",
    snap_at: "30d"
  }
], R = {
  arrow_curve: 5,
  auto_move_label: !1,
  bar_corner_radius: 3,
  bar_height: 30,
  container_height: "auto",
  column_width: null,
  date_format: "YYYY-MM-DD HH:mm",
  upper_header_height: 45,
  lower_header_height: 30,
  snap_at: null,
  infinite_padding: !0,
  holidays: { "var(--g-weekend-highlight-color)": "weekend" },
  ignore: [],
  language: "en",
  lines: "both",
  move_dependencies: !0,
  padding: 18,
  popup: (r) => {
    r.set_title(r.task.name), r.task.description ? r.set_subtitle(r.task.description) : r.set_subtitle("");
    const t = c.format(
      r.task._start,
      "MMM D",
      r.chart.options.language
    ), e = c.format(
      c.add(r.task._end, -1, "second"),
      "MMM D",
      r.chart.options.language
    ), i = r.task.actual_duration === 1 ? "day" : "days";
    r.set_details(
      `${t} - ${e} (${r.task.actual_duration} ${i}${r.task.ignored_duration ? " + " + r.task.ignored_duration + " excluded" : ""})<br/>Progress: ${Math.floor(r.task.progress * 100) / 100}%`
    );
  },
  popup_on: "click",
  readonly_progress: !1,
  readonly_dates: !1,
  readonly: !1,
  rtl: !1,
  pack_done_tasks: !1,
  hover_on_date: !1,
  fixed_duration: !1,
  scroll_to: "today",
  show_expected_progress: !1,
  today_button: !0,
  view_mode: "Day",
  view_mode_select: !1,
  view_modes: v,
  is_weekend: (r) => r.getDay() === 0 || r.getDay() === 6
};
class Q {
  constructor(t, e, i) {
    this.setup_wrapper(t), this.setup_options(i), this.setup_tasks(e), this.change_view_mode(), this.bind_events();
  }
  setup_wrapper(t) {
    let e, i;
    if (typeof t == "string") {
      let s = document.querySelector(t);
      if (!s)
        throw new ReferenceError(
          `CSS selector "${t}" could not be found in DOM`
        );
      t = s;
    }
    if (t instanceof HTMLElement)
      i = t, e = t.querySelector("svg");
    else if (t instanceof SVGElement)
      e = t;
    else
      throw new TypeError(
        "Frappe Gantt only supports usage of a string CSS selector, HTML DOM element or SVG DOM element for the 'element' parameter"
      );
    e ? (this.$svg = e, this.$svg.classList.add("gantt")) : this.$svg = u("svg", {
      append_to: i,
      class: "gantt"
    }), this.$container = this.create_el({
      classes: "gantt-container",
      append_to: this.$svg.parentElement
    }), this.$container.appendChild(this.$svg), this.$popup_wrapper = this.create_el({
      classes: "popup-wrapper",
      append_to: this.$container
    });
  }
  setup_options(t) {
    this.original_options = t, t != null && t.view_modes && (t.view_modes = t.view_modes.map((i) => {
      if (typeof i == "string") {
        const s = v.find(
          (n) => n.name === i
        );
        return s || console.error(
          `The view mode "${i}" is not predefined in Frappe Gantt. Please define the view mode object instead.`
        ), s;
      }
      return i;
    }), t.view_mode = t.view_modes[0]), this.options = { ...R, ...t };
    const e = {
      "grid-height": "container_height",
      "bar-height": "bar_height",
      "lower-header-height": "lower_header_height",
      "upper-header-height": "upper_header_height"
    };
    for (let i in e) {
      let s = this.options[e[i]];
      s !== "auto" && this.$container.style.setProperty(
        "--gv-" + i,
        s + "px"
      );
    }
    if (this.config = {
      ignored_dates: [],
      ignored_positions: [],
      extend_by_units: 10
    }, typeof this.options.ignore != "function") {
      typeof this.options.ignore == "string" && (this.options.ignore = [this.options.ignore]);
      for (let i of this.options.ignore) {
        if (typeof i == "function") {
          this.config.ignored_function = i;
          continue;
        }
        typeof i == "string" && (i === "weekend" ? this.config.ignored_function = (s) => s.getDay() == 6 || s.getDay() == 0 : this.config.ignored_dates.push(/* @__PURE__ */ new Date(i + " ")));
      }
    } else
      this.config.ignored_function = this.options.ignore;
    this.options.rtl && this.$container && this.$container.classList.add("gantt-rtl");
  }
  update_options(t) {
    this.setup_options({ ...this.original_options, ...t }), this.change_view_mode(void 0, !0);
  }
  setup_tasks(t) {
    this.tasks = t.map((e, i) => {
      if (!e.start)
        return console.error(
          `task "${e.id}" doesn't have a start date`
        ), !1;
      if (e._start = c.parse(e.start), e.end === void 0 && e.duration !== void 0 && (e.end = e._start, e.duration.split(" ").forEach((a) => {
        let { duration: d, scale: h } = c.parse_duration(a);
        e.end = c.add(e.end, d, h);
      })), !e.end)
        return console.error(`task "${e.id}" doesn't have an end date`), !1;
      if (e._end = c.parse(e.end), c.diff(e._end, e._start, "year") < 0)
        return console.error(
          `start of task can't be after end of task: in task "${e.id}"`
        ), !1;
      if (c.diff(e._end, e._start, "year") > 10)
        return console.error(
          `the duration of task "${e.id}" is too long (above ten years)`
        ), !1;
      if (e._index = i, c.get_date_values(e._end).slice(3).every((o) => o === 0) && (e._end = c.add(e._end, 24, "hour")), typeof e.dependencies == "string" || !e.dependencies) {
        let o = [];
        e.dependencies && (o = e.dependencies.split(",").map((a) => a.trim().replaceAll(" ", "_")).filter((a) => a)), e.dependencies = o;
      }
      return e.id ? typeof e.id == "string" ? e.id = e.id.replaceAll(" ", "_") : e.id = `${e.id}` : e.id = K(e), e;
    }).filter((e) => e), this.tasks.forEach((e) => {
      e._row = e._index;
    }), this.options.pack_done_tasks ? this.apply_row_packing() : this._visual_row_count = this.tasks.length, this.setup_dependencies();
  }
  setup_dependencies() {
    this.dependency_map = {};
    for (let t of this.tasks)
      for (let e of t.dependencies)
        this.dependency_map[e] = this.dependency_map[e] || [], this.dependency_map[e].push(t.id);
  }
  apply_row_packing() {
    const t = this.tasks.filter((n) => n.done === !0), e = this.tasks.filter((n) => n.done !== !0);
    t.sort((n, o) => n._start - o._start);
    const i = [];
    for (let n of t) {
      let o = !1;
      for (let a = 0; a < i.length; a++)
        if (!i[a].some(
          (h) => n._start < h._end && h._start < n._end
        )) {
          i[a].push(n), n._row = a, o = !0;
          break;
        }
      o || (i.push([n]), n._row = i.length - 1);
    }
    const s = i.length;
    e.sort((n, o) => n._index - o._index), e.forEach((n, o) => {
      n._row = s + o;
    }), this._visual_row_count = s + e.length;
  }
  refresh(t) {
    this.setup_tasks(t), this.change_view_mode();
  }
  update_task(t, e) {
    let i = this.tasks.find((n) => n.id === t), s = this.bars[i._index];
    Object.assign(i, e), s.refresh();
  }
  change_view_mode(t = this.options.view_mode, e = !1) {
    typeof t == "string" && (t = this.options.view_modes.find((n) => n.name === t));
    let i, s;
    e && (i = this.$container.scrollLeft, s = this.options.scroll_to, this.options.scroll_to = null), this.options.view_mode = t.name, this.config.view_mode = t, this.update_view_scale(t), this.setup_dates(e), this.render(), e && (this.$container.scrollLeft = i, this.options.scroll_to = s), this.trigger_event("view_change", [t]);
  }
  update_view_scale(t) {
    let { duration: e, scale: i } = c.parse_duration(t.step);
    this.config.step = e, this.config.unit = i, this.config.column_width = this.options.column_width || t.column_width || 45, this.$container.style.setProperty(
      "--gv-column-width",
      this.config.column_width + "px"
    ), this.config.header_height = this.options.lower_header_height + this.options.upper_header_height + 10;
  }
  setup_dates(t = !1) {
    this.setup_gantt_dates(t), this.setup_date_values();
  }
  setup_gantt_dates(t) {
    let e, i;
    this.tasks.length || (e = /* @__PURE__ */ new Date(), i = /* @__PURE__ */ new Date());
    for (let s of this.tasks)
      (!e || s._start < e) && (e = s._start), (!i || s._end > i) && (i = s._end);
    if (e = c.start_of(e, this.config.unit), i = c.start_of(i, this.config.unit), !t)
      if (this.options.infinite_padding)
        this.gantt_start = c.add(
          e,
          -this.config.extend_by_units * 3,
          this.config.unit
        ), this.gantt_end = c.add(
          i,
          this.config.extend_by_units * 3,
          this.config.unit
        );
      else {
        typeof this.config.view_mode.padding == "string" && (this.config.view_mode.padding = [
          this.config.view_mode.padding,
          this.config.view_mode.padding
        ]);
        let [s, n] = this.config.view_mode.padding.map(
          c.parse_duration
        );
        this.gantt_start = c.add(
          e,
          -s.duration,
          s.scale
        ), this.gantt_end = c.add(
          i,
          n.duration,
          n.scale
        );
      }
    this.config.date_format = this.config.view_mode.date_format || this.options.date_format, this.gantt_start.setHours(0, 0, 0, 0);
  }
  setup_date_values() {
    let t = this.gantt_start;
    for (this.dates = [t]; t < this.gantt_end; )
      t = c.add(
        t,
        this.config.step,
        this.config.unit
      ), this.dates.push(t);
  }
  bind_events() {
    this.bind_grid_click(), this.bind_holiday_labels(), this.bind_bar_events();
  }
  render() {
    this.clear(), this.inject_rtl_styles(), this.setup_layers(), this.make_grid(), this.make_dates(), this.make_grid_extras(), this.make_bars(), this.make_arrows(), this.map_arrows_on_bars(), this.set_dimensions(), this.set_scroll_position(this.options.scroll_to);
  }
  inject_rtl_styles() {
    if (!this.options.rtl)
      return;
    const t = "gantt-rtl-styles";
    if (document.getElementById(t))
      return;
    const e = document.createElement("style");
    e.id = t, e.textContent = `
        .gantt-rtl svg.gantt {
            transform: scaleX(-1);
        }
        .gantt-rtl .grid-header {
            transform: scaleX(-1);
        }
        .gantt-rtl svg.gantt text {
            transform-box: fill-box;
            transform-origin: center;
            transform: scaleX(-1);
        }
        .gantt-rtl .lower-text,
        .gantt-rtl .upper-text {
            transform: scaleX(-1);
        }
        .gantt-rtl .side-header,
        .gantt-rtl .today-button,
        .gantt-rtl .viewmode-select {
            transform: scaleX(-1);
        }
        .gantt-rtl .popup-wrapper {
            direction: rtl;
            text-align: right;
        }
        .gantt-rtl .holiday-label {
            transform: scaleX(-1);
        }
    `, document.head.appendChild(e);
  }
  setup_layers() {
    this.layers = {};
    const t = ["grid", "arrow", "progress", "bar"];
    for (let e of t)
      this.layers[e] = u("g", {
        class: e,
        append_to: this.$svg
      });
    this.$extras = this.create_el({
      classes: "extras",
      append_to: this.$container
    }), this.$adjust = this.create_el({
      classes: "adjust hide",
      append_to: this.$extras,
      type: "button"
    }), this.$adjust.innerHTML = "&larr;";
  }
  make_grid() {
    this.make_grid_background(), this.make_grid_rows(), this.make_grid_header(), this.make_side_header();
  }
  make_grid_extras() {
    this.make_grid_highlights(), this.make_grid_ticks();
  }
  make_grid_background() {
    const t = this.dates.length * this.config.column_width, e = this._visual_row_count || this.tasks.length, i = Math.max(
      this.config.header_height + this.options.padding + (this.options.bar_height + this.options.padding) * e - // <-- CHANGED
      10,
      this.options.container_height !== "auto" ? this.options.container_height : 0
    );
    u("rect", {
      x: 0,
      y: 0,
      width: t,
      height: i,
      class: "grid-background",
      append_to: this.$svg
    }), p.attr(this.$svg, {
      height: i,
      width: "100%"
    }), this.grid_height = i, this.options.container_height === "auto" && (this.$container.style.height = i + "px");
  }
  make_grid_rows() {
    const t = u("g", { append_to: this.layers.grid }), e = this.dates.length * this.config.column_width, i = this.options.bar_height + this.options.padding;
    this.config.header_height;
    for (let s = this.config.header_height; s < this.grid_height; s += i)
      u("rect", {
        x: 0,
        y: s,
        width: e,
        height: i,
        class: "grid-row",
        append_to: t
      });
  }
  make_grid_header() {
    this.$header = this.create_el({
      width: this.dates.length * this.config.column_width,
      classes: "grid-header",
      append_to: this.$container
    }), this.$upper_header = this.create_el({
      classes: "upper-header",
      append_to: this.$header
    }), this.$lower_header = this.create_el({
      classes: "lower-header",
      append_to: this.$header
    });
  }
  make_side_header() {
    if (this.$side_header = this.create_el({ classes: "side-header" }), this.$upper_header.prepend(this.$side_header), this.options.view_mode_select) {
      const t = document.createElement("select");
      t.classList.add("viewmode-select");
      const e = document.createElement("option");
      e.selected = !0, e.disabled = !0, e.textContent = "Mode", t.appendChild(e);
      for (const i of this.options.view_modes) {
        const s = document.createElement("option");
        s.value = i.name, s.textContent = i.name, i.name === this.config.view_mode.name && (s.selected = !0), t.appendChild(s);
      }
      t.addEventListener(
        "change",
        (function() {
          this.change_view_mode(t.value, !0);
        }).bind(this)
      ), this.$side_header.appendChild(t);
    }
    if (this.options.today_button) {
      let t = document.createElement("button");
      t.classList.add("today-button"), t.textContent = "Today", t.onclick = this.scroll_current.bind(this), this.$side_header.prepend(t), this.$today_button = t;
    }
  }
  make_grid_ticks() {
    if (this.options.lines === "none")
      return;
    let t = 0, e = this.config.header_height, i = this.grid_height - this.config.header_height, s = u("g", {
      class: "lines_layer",
      append_to: this.layers.grid
    }), n = this.config.header_height;
    const o = this.dates.length * this.config.column_width, a = this.options.bar_height + this.options.padding;
    if (this.options.lines !== "vertical")
      for (let d = this.config.header_height; d < this.grid_height; d += a)
        u("line", {
          x1: 0,
          y1: n + a,
          x2: o,
          y2: n + a,
          class: "row-line",
          append_to: s
        }), n += a;
    if (this.options.lines !== "horizontal")
      for (let d of this.dates) {
        let h = "tick";
        this.config.view_mode.thick_line && this.config.view_mode.thick_line(d) && (h += " thick"), u("path", {
          d: `M ${t} ${e} v ${i}`,
          class: h,
          append_to: this.layers.grid
        }), this.view_is("month") ? t += c.get_days_in_month(d) * this.config.column_width / 30 : this.view_is("year") ? t += c.get_days_in_year(d) * this.config.column_width / 365 : t += this.config.column_width;
      }
  }
  highlight_holidays() {
    let t = {};
    if (this.options.holidays)
      for (let e in this.options.holidays) {
        let i = this.options.holidays[e];
        i === "weekend" && (i = this.options.is_weekend);
        let s;
        if (typeof i == "object") {
          let n = i.find((o) => typeof o == "function");
          if (n && (s = n), this.options.holidays.name) {
            let o = /* @__PURE__ */ new Date(i.date + " ");
            i = (a) => o.getTime() === a.getTime(), t[o] = i.name;
          } else
            i = (o) => this.options.holidays[e].filter((a) => typeof a != "function").map((a) => {
              if (a.name) {
                let d = /* @__PURE__ */ new Date(a.date + " ");
                return t[d] = a.name, d.getTime();
              }
              return (/* @__PURE__ */ new Date(a + " ")).getTime();
            }).includes(o.getTime());
        }
        for (let n = new Date(this.gantt_start); n <= this.gantt_end; n.setDate(n.getDate() + 1)) {
          if (this.config.ignored_dates.find(
            (l) => l.getTime() == n.getTime()
          ) || this.config.ignored_function && this.config.ignored_function(n))
            continue;
          const o = i(n) || s && s(n), a = c.diff(n, this.gantt_start, this.config.unit) / this.config.step * this.config.column_width, d = this.grid_height - this.config.header_height, h = c.format(n, "YYYY-MM-DD", this.options.language).replace(" ", "_"), _ = {
            x: Math.round(a),
            y: this.config.header_height,
            width: this.config.column_width / c.convert_scales(
              this.config.view_mode.step,
              "day"
            ),
            height: d,
            append_to: this.layers.grid
          };
          if (o) {
            if (t[n]) {
              let l = this.create_el({
                classes: "holiday-label label_" + h,
                append_to: this.$extras
              });
              l.textContent = t[n];
            }
            u("rect", {
              ..._,
              class: "holiday-highlight " + h + (this.options.hover_on_date ? " grid-column" : ""),
              style: `fill: ${e};`,
              append_to: this.layers.grid
            });
          } else
            this.options.hover_on_date && u("rect", {
              ..._,
              class: "grid-column"
            });
        }
      }
  }
  /**
   * Compute the horizontal x-axis distance and associated date for the current date and view.
   *
   * @returns Object containing the x-axis distance and date of the current date, or null if the current date is out of the gantt range.
   */
  highlight_current() {
    const t = this.get_closest_date();
    if (!t || !t[1])
      return;
    const [e, i] = t;
    i.classList.add("current-date-highlight");
    let n = c.diff(
      /* @__PURE__ */ new Date(),
      this.gantt_start,
      this.config.unit
    ) / this.config.step * this.config.column_width;
    this.options.rtl && (n = this.dates.length * this.config.column_width - n), this.$current_highlight = this.create_el({
      top: this.config.header_height - 6,
      left: n - 2.5,
      height: this.grid_height - this.config.header_height,
      classes: "current-highlight",
      append_to: this.$container
    }), this.$current_ball_highlight = this.create_el({
      top: this.config.header_height - 6,
      left: n - 2.5,
      width: 6,
      height: 6,
      classes: "current-ball-highlight",
      append_to: this.$header
    });
  }
  make_grid_highlights() {
    this.highlight_holidays(), this.config.ignored_positions = [];
    const t = this._visual_row_count || this.tasks.length, e = (this.options.bar_height + this.options.padding) * t;
    this.layers.grid.innerHTML += `<pattern id="diagonalHatch" patternUnits="userSpaceOnUse" width="4" height="4">
          <path d="M-1,1 l2,-2
                   M0,4 l4,-4
                   M3,5 l2,-2"
                style="stroke:grey; stroke-width:0.3" />
        </pattern>`;
    for (let s = new Date(this.gantt_start); s <= this.gantt_end; s.setDate(s.getDate() + 1)) {
      if (!this.config.ignored_dates.find(
        (x) => x.getTime() == s.getTime()
      ) && (!this.config.ignored_function || !this.config.ignored_function(s)))
        continue;
      let o = c.convert_scales(
        c.diff(s, this.gantt_start) + "d",
        this.config.unit
      ) / this.config.step * this.config.column_width;
      this.config.ignored_positions.push(o);
      let a = !1;
      this.options.is_holiday && this.options.is_holiday(s) && (a = !0);
      let h = { hour: 1 / 24, day: 1, month: 30, year: 365 }[this.config.unit] || 1, _ = this.config.column_width / this.config.step / h, l = Math.max(_, 4), f = `rgba(54, 162, 235, ${_ < 10 ? "0.45" : "0.12"})`, m = a ? `fill: ${f};` : "fill: url(#diagonalHatch);";
      u("rect", {
        x: o,
        y: this.config.header_height,
        width: l,
        height: e,
        class: a ? "ignored-bar holiday-bar" : "ignored-bar",
        style: m,
        append_to: this.$svg
      });
    }
    this.highlight_current(
      this.config.view_mode
    );
  }
  create_el({ left: t, top: e, width: i, height: s, id: n, classes: o, append_to: a, type: d }) {
    let h = document.createElement(d || "div");
    for (let _ of o.split(" "))
      h.classList.add(_);
    return h.style.top = e + "px", h.style.left = t + "px", n && (h.id = n), i && (h.style.width = i + "px"), s && (h.style.height = s + "px"), a && a.appendChild(h), h;
  }
  make_dates() {
    this.get_dates_to_draw().forEach((t, e) => {
      if (t.lower_text) {
        let i = this.create_el({
          left: t.x,
          top: t.lower_y,
          classes: "lower-text date_" + X(t.formatted_date),
          append_to: this.$lower_header
        });
        i.innerText = t.lower_text;
      }
      if (t.upper_text) {
        let i = this.create_el({
          left: t.x,
          top: t.upper_y,
          classes: "upper-text",
          append_to: this.$upper_header
        });
        i.innerText = t.upper_text;
      }
    }), this.upperTexts = Array.from(
      this.$container.querySelectorAll(".upper-text")
    ), this.lowerTexts = Array.from(
      this.$container.querySelectorAll(".lower-text")
    );
  }
  get_dates_to_draw() {
    let t = null;
    return this.dates.map((i, s) => {
      const n = this.get_date_info(i, t, s);
      return t = n, n;
    });
  }
  get_date_info(t, e) {
    let i = e ? e.date : null;
    this.config.column_width;
    const s = e ? e.x + e.column_width : 0;
    let n = this.config.view_mode.upper_text, o = this.config.view_mode.lower_text;
    return n ? typeof n == "string" && (this.config.view_mode.upper_text = (a) => c.format(a, n, this.options.language)) : this.config.view_mode.upper_text = () => "", o ? typeof o == "string" && (this.config.view_mode.lower_text = (a) => c.format(a, o, this.options.language)) : this.config.view_mode.lower_text = () => "", {
      date: t,
      formatted_date: X(
        c.format(
          t,
          this.config.date_format,
          this.options.language
        )
      ),
      column_width: this.config.column_width,
      x: s,
      upper_text: this.config.view_mode.upper_text(
        t,
        i,
        this.options.language
      ),
      lower_text: this.config.view_mode.lower_text(
        t,
        i,
        this.options.language
      ),
      upper_y: 17,
      lower_y: this.options.upper_header_height + 5
    };
  }
  make_bars() {
    this.bars = this.tasks.map((t) => {
      const e = new V(this, t);
      return this.layers.bar.appendChild(e.group), e;
    });
  }
  make_arrows() {
    this.arrows = [];
    for (let t of this.tasks) {
      let e = [];
      e = t.dependencies.map((i) => {
        const s = this.get_task(i);
        if (!s)
          return;
        const n = new U(
          this,
          this.bars[s._index],
          // from_task
          this.bars[t._index]
          // to_task
        );
        return this.layers.arrow.appendChild(n.element), n;
      }).filter(Boolean), this.arrows = this.arrows.concat(e);
    }
  }
  map_arrows_on_bars() {
    for (let t of this.bars)
      t.arrows = this.arrows.filter((e) => e.from_task.task.id === t.task.id || e.to_task.task.id === t.task.id);
  }
  set_dimensions() {
    const { width: t } = this.$svg.getBoundingClientRect(), e = this.$svg.querySelector(".grid .grid-row") ? this.$svg.querySelector(".grid .grid-row").getAttribute("width") : 0;
    t < e && this.$svg.setAttribute("width", e);
  }
  set_scroll_position(t) {
    if (this.options.infinite_padding && (!t || t === "start")) {
      let [o, ...a] = this.get_start_end_positions();
      this.$container.scrollLeft = o;
      return;
    }
    if (!t || t === "start")
      t = this.gantt_start;
    else if (t === "end")
      t = this.gantt_end;
    else {
      if (t === "today")
        return this.scroll_current();
      typeof t == "string" && (t = c.parse(t));
    }
    const i = c.diff(
      t,
      this.gantt_start,
      this.config.unit
    ) / this.config.step * this.config.column_width;
    this.$container.scrollTo({
      left: i - this.config.column_width / 6,
      behavior: "smooth"
    }), this.$current && this.$current.classList.remove("current-upper"), this.current_date = c.add(
      this.gantt_start,
      this.$container.scrollLeft / this.config.column_width,
      this.config.unit
    );
    let s = this.config.view_mode.upper_text(
      this.current_date,
      null,
      this.options.language
    ), n = this.upperTexts.find(
      (o) => o.textContent === s
    );
    this.current_date = c.add(
      this.gantt_start,
      (this.$container.scrollLeft + n.clientWidth) / this.config.column_width,
      this.config.unit
    ), s = this.config.view_mode.upper_text(
      this.current_date,
      null,
      this.options.language
    ), n = this.upperTexts.find((o) => o.textContent === s), n.classList.add("current-upper"), this.$current = n;
  }
  scroll_current() {
    let t = this.get_closest_date();
    t && this.set_scroll_position(t[0]);
  }
  get_closest_date() {
    let t = /* @__PURE__ */ new Date();
    if (t < this.gantt_start || t > this.gantt_end)
      return null;
    let e = /* @__PURE__ */ new Date(), i = this.$container.querySelector(
      ".date_" + X(
        c.format(
          e,
          this.config.date_format,
          this.options.language
        )
      )
    ), s = 0;
    for (; !i && s < this.config.step; )
      e = c.add(e, -1, this.config.unit), i = this.$container.querySelector(
        ".date_" + X(
          c.format(
            e,
            this.config.date_format,
            this.options.language
          )
        )
      ), s++;
    return [
      /* @__PURE__ */ new Date(
        c.format(
          e,
          this.config.date_format,
          this.options.language
        ) + " "
      ),
      i
    ];
  }
  bind_grid_click() {
    p.on(
      this.$container,
      "click",
      ".grid-row, .grid-header, .ignored-bar, .holiday-highlight",
      () => {
        this.unselect_all(), this.hide_popup();
      }
    );
  }
  bind_holiday_labels() {
    const t = this.$container.querySelectorAll(".holiday-highlight");
    for (let e of t) {
      const i = this.$container.querySelector(
        ".label_" + e.classList[1]
      );
      if (!i)
        continue;
      let s;
      e.onmouseenter = (n) => {
        s = setTimeout(() => {
          i.classList.add("show"), i.style.left = (n.offsetX || n.layerX) + "px", i.style.top = (n.offsetY || n.layerY) + "px";
        }, 300);
      }, e.onmouseleave = (n) => {
        clearTimeout(s), i.classList.remove("show");
      };
    }
  }
  get_start_end_positions() {
    if (!this.bars.length)
      return [0, 0, 0];
    let { x: t, width: e } = this.bars[0].group.getBBox(), i = t, s = t, n = t + e;
    return Array.prototype.forEach.call(this.bars, function({ group: o }, a) {
      let { x: d, width: h } = o.getBBox();
      d < i && (i = d), d > s && (s = d), d + h > n && (n = d + h);
    }), [i, s, n];
  }
  bind_bar_events() {
    let t = !1, e = 0, i = 0, s = !1, n = !1, o = null, a = [];
    this.bar_being_dragged = null;
    const d = () => t || s || n;
    this.$svg.onclick = (_) => {
      _.target.classList.contains("grid-row") && this.unselect_all();
    };
    let h = 0;
    if (p.on(this.$svg, "mousemove", ".bar-wrapper, .handle", (_) => {
      this.bar_being_dragged === !1 && Math.abs((_.offsetX || _.layerX) - h) > 10 && (this.bar_being_dragged = !0);
    }), p.on(this.$svg, "mousedown", ".grid-column", (_) => {
      this.trigger_event("date_click", [this.getDateFromClick(_)]);
    }), p.on(this.$svg, "mousedown", ".bar-wrapper, .handle", (_, l) => {
      const g = p.closest(".bar-wrapper", l);
      l.classList.contains("left") ? (s = !0, l.classList.add("visible")) : l.classList.contains("right") ? (n = !0, l.classList.add("visible")) : l.classList.contains("bar-wrapper") && (t = !0), this.popup && this.popup.hide(), e = _.offsetX || _.layerX, o = g.getAttribute("data-id"), a = [this.get_bar(o)], this._all_bars_snapshot = this.bars.map((f) => {
        const m = f.$bar;
        return {
          bar: f,
          id: f.task.id,
          ox: m.getX(),
          owidth: m.getWidth(),
          pushed: !1
          // true once this bar joins the active drag
        };
      }), this.bar_being_dragged = !1, h = e, a.forEach((f) => {
        const m = f.$bar;
        m.ox = m.getX(), m.oy = m.getY(), m.owidth = m.getWidth(), m.finaldx = 0;
      });
    }), this.options.infinite_padding) {
      let _ = !1;
      p.on(this.$container, "mousewheel", (l) => {
        let g = this.$container.scrollWidth / 2;
        if (!_ && l.currentTarget.scrollLeft <= g) {
          let f = l.currentTarget.scrollLeft;
          _ = !0, this.gantt_start = c.add(
            this.gantt_start,
            -this.config.extend_by_units,
            this.config.unit
          ), this.setup_date_values(), this.render(), l.currentTarget.scrollLeft = f + this.config.column_width * this.config.extend_by_units, setTimeout(() => _ = !1, 300);
        }
        if (!_ && l.currentTarget.scrollWidth - (l.currentTarget.scrollLeft + l.currentTarget.clientWidth) <= g) {
          let f = l.currentTarget.scrollLeft;
          _ = !0, this.gantt_end = c.add(
            this.gantt_end,
            this.config.extend_by_units,
            this.config.unit
          ), this.setup_date_values(), this.render(), l.currentTarget.scrollLeft = f, setTimeout(() => _ = !1, 300);
        }
      });
    }
    p.on(this.$container, "scroll", (_) => {
      let l = [];
      const g = this.bars.map(
        ({ group: w }) => w.getAttribute("data-id")
      );
      let f;
      i && (f = _.currentTarget.scrollLeft - i), this.current_date = c.add(
        this.gantt_start,
        _.currentTarget.scrollLeft / this.config.column_width * this.config.step,
        this.config.unit
      );
      let m = this.config.view_mode.upper_text(
        this.current_date,
        null,
        this.options.language
      ), x = this.upperTexts.find(
        (w) => w.textContent === m
      );
      this.current_date = c.add(
        this.gantt_start,
        (_.currentTarget.scrollLeft + x.clientWidth) / this.config.column_width * this.config.step,
        this.config.unit
      ), m = this.config.view_mode.upper_text(
        this.current_date,
        null,
        this.options.language
      ), x = this.upperTexts.find(
        (w) => w.textContent === m
      ), x !== this.$current && (this.$current && this.$current.classList.remove("current-upper"), x.classList.add("current-upper"), this.$current = x), i = _.currentTarget.scrollLeft;
      let [$, Y, A] = this.get_start_end_positions();
      i > A + 100 ? (this.$adjust.innerHTML = "&larr;", this.$adjust.classList.remove("hide"), this.$adjust.onclick = () => {
        this.$container.scrollTo({
          left: Y,
          behavior: "smooth"
        });
      }) : i + _.currentTarget.offsetWidth < $ - 100 ? (this.$adjust.innerHTML = "&rarr;", this.$adjust.classList.remove("hide"), this.$adjust.onclick = () => {
        this.$container.scrollTo({
          left: $,
          behavior: "smooth"
        });
      }) : this.$adjust.classList.add("hide"), f && (l = g.map((w) => this.get_bar(w)), this.options.auto_move_label && l.forEach((w) => {
        w.update_label_position_on_horizontal_scroll({
          x: f,
          sx: _.currentTarget.scrollLeft
        });
      }));
    }), p.on(this.$svg, "mousemove", (_) => {
      if (!d())
        return;
      const l = (_.offsetX || _.layerX) - e;
      this.hide_popup();
      const g = a[0];
      if (g.$bar.finaldx = this.get_snap_position(l, g.$bar.ox), s ? o === g.task.id && g.update_bar_position({
        x: g.$bar.ox + g.$bar.finaldx,
        width: g.$bar.owidth - g.$bar.finaldx
      }) : n ? o === g.task.id && g.update_bar_position({
        width: g.$bar.owidth + g.$bar.finaldx
      }) : t && !this.options.readonly && !this.options.readonly_dates && g.update_bar_position({ x: g.$bar.ox + g.$bar.finaldx }), this.options.move_dependencies && !this.options.readonly && !this.options.readonly_dates && !s && !n) {
        const f = g.$bar.finaldx >= 0, m = g.task.id, x = {};
        this._all_bars_snapshot.forEach((w) => {
          x[w.id] = w;
        });
        const $ = /* @__PURE__ */ new Set([m]), Y = (w) => {
          const T = w.$bar.getX() + w.$bar.getWidth(), S = w.task.id, D = this.dependency_map[S] || [];
          for (const y of D) {
            if ($.has(y))
              continue;
            const b = x[y];
            if (!b)
              continue;
            const k = b.bar, M = k.$bar.getX();
            if (T > M) {
              $.add(y);
              let L = T;
              L = this.get_safe_x(L, 1), L > b.ox && (b.pushed = !0, k.$bar.finaldx = L - b.ox, k.update_bar_position({ x: L }), Y(k));
            } else
              b.pushed && (b.pushed = !1, k.$bar.finaldx = 0, k.update_bar_position({ x: b.ox }), this._revert_downstream(y, x, $));
          }
        }, A = (w) => {
          const T = w.$bar.getX();
          w.task.id;
          const S = w.task.dependencies || [];
          for (const D of S) {
            if ($.has(D))
              continue;
            const y = x[D];
            if (!y)
              continue;
            const b = y.bar, k = b.$bar.getX() + b.$bar.getWidth();
            if (T < k) {
              $.add(D);
              let M = T - b.$bar.getWidth();
              M = this.get_safe_x(M, -1), M < y.ox && (y.pushed = !0, b.$bar.finaldx = M - y.ox, b.update_bar_position({ x: M }), A(b));
            } else
              y.pushed && (y.pushed = !1, b.$bar.finaldx = 0, b.update_bar_position({ x: y.ox }), this._revert_upstream(D, x, $));
          }
        };
        f ? Y(g) : A(g);
      }
    }), document.addEventListener("mouseup", () => {
      var _, l, g;
      t = !1, s = !1, n = !1, (g = (l = (_ = this.$container.querySelector(".visible")) == null ? void 0 : _.classList) == null ? void 0 : l.remove) == null || g.call(l, "visible");
    }), p.on(this.$svg, "mouseup", (_) => {
      this.bar_being_dragged = null, a.forEach((l) => {
        l.$bar.finaldx && (l.date_changed(), l.compute_progress(), l.set_action_completed());
      }), this._all_bars_snapshot && (this._all_bars_snapshot.forEach((l) => {
        l.pushed && l.bar.date_changed();
      }), this._all_bars_snapshot = null);
    }), this.bind_bar_progress();
  }
  bind_bar_progress() {
    let t = 0, e = null, i = null, s = null, n = null;
    p.on(this.$svg, "mousedown", ".handle.progress", (a, d) => {
      e = !0, t = a.offsetX || a.layerX;
      const _ = p.closest(".bar-wrapper", d).getAttribute("data-id");
      i = this.get_bar(_), s = i.$bar_progress, n = i.$bar, s.finaldx = 0, s.owidth = s.getWidth(), s.min_dx = -s.owidth, s.max_dx = n.getWidth() - s.getWidth();
    });
    const o = this.config.ignored_positions.map((a) => [
      a,
      a + this.config.column_width
    ]);
    p.on(this.$svg, "mousemove", (a) => {
      if (!e)
        return;
      let d = a.offsetX || a.layerX;
      if (d > t) {
        let l = o.find(
          ([g, f]) => d >= g && d < f
        );
        for (; l; )
          d = l[1], l = o.find(
            ([g, f]) => d >= g && d < f
          );
      } else {
        let l = o.find(
          ([g, f]) => d > g && d <= f
        );
        for (; l; )
          d = l[0], l = o.find(
            ([g, f]) => d > g && d <= f
          );
      }
      let _ = d - t;
      _ > s.max_dx && (_ = s.max_dx), _ < s.min_dx && (_ = s.min_dx), s.setAttribute("width", s.owidth + _), p.attr(i.$handle_progress, "cx", s.getEndX()), s.finaldx = _;
    }), p.on(this.$svg, "mouseup", () => {
      e = !1, s && s.finaldx && (s.finaldx = 0, i.progress_changed(), i.set_action_completed(), i = null, s = null, n = null);
    });
  }
  get_all_dependent_tasks(t) {
    let e = [], i = [t];
    for (; i.length > 0; ) {
      const n = i.reduce((o, a) => {
        const d = this.dependency_map[a] || [];
        return o.concat(d);
      }, []).filter((o) => o && !e.includes(o) && !i.includes(o));
      e = e.concat(n), i = n;
    }
    return e;
  }
  /**
   * Revert any bars we cascaded forward from `bar_id` during this drag pass.
   * Called when the dragged bar backs off and the collision no longer holds —
   * we have to un-push the chain we created, otherwise pushed children would
   * remain shifted after the dragged bar moves away from them.
   *
   * @param {string} bar_id - the id whose downstream cascade we're undoing
   * @param {Object} snap_by_id - id → snapshot map built in mousemove
   * @param {Set} visited - the visited set from this drag pass
   */
  _revert_downstream(t, e, i) {
    const s = this.dependency_map[t] || [];
    for (const n of s) {
      const o = e[n];
      !o || !o.pushed || (o.pushed = !1, o.bar.$bar.finaldx = 0, o.bar.update_bar_position({ x: o.ox }), i.delete(n), this._revert_downstream(n, e, i));
    }
  }
  /**
   * Symmetric revert for backward cascade — undoes any parents we pushed
   * leftward earlier in this drag pass once the dragged bar moves back to
   * the right and no longer overlaps the parent.
   */
  _revert_upstream(t, e, i) {
    const s = this.get_task(t);
    if (!s)
      return;
    const n = s.dependencies || [];
    for (const o of n) {
      const a = e[o];
      !a || !a.pushed || (a.pushed = !1, a.bar.$bar.finaldx = 0, a.bar.update_bar_position({ x: a.ox }), i.delete(o), this._revert_upstream(o, e, i));
    }
  }
  get_all_parent_tasks(t) {
    let e = [], i = [t];
    for (; i.length > 0; ) {
      const n = i.reduce((o, a) => {
        const d = this.get_task(a);
        return o.concat(d ? d.dependencies : []);
      }, []).filter((o) => o && !e.includes(o) && !i.includes(o));
      e = e.concat(n), i = n;
    }
    return e;
  }
  get_safe_x(t, e = 1) {
    let i = t / this.config.column_width, s = Math.floor(i), n = i - s, o = !1, a = 0;
    for (; !o && a < 100; ) {
      let d = c.add(
        this.gantt_start,
        s * this.config.step,
        this.config.unit
      ), h = this.options.is_weekend && this.options.is_weekend(d), _ = this.options.is_holiday && this.options.is_holiday(d);
      h || _ ? (s += e, a++) : o = !0;
    }
    return (s + n) * this.config.column_width;
  }
  get_snap_position(t, e) {
    let i = 1;
    const s = this.options.snap_at || this.config.view_mode.snap_at || "1d";
    if (s !== "unit") {
      const { duration: h, scale: _ } = c.parse_duration(s);
      i = c.convert_scales(this.config.view_mode.step, _) / h;
    }
    const n = t % (this.config.column_width / i);
    let o = t - n + (n < this.config.column_width / i * 2 ? 0 : this.config.column_width / i), a = e + o;
    const d = o >= 0 ? 1 : -1;
    return this.get_safe_x(a, d) - e;
  }
  get_ignored_region(t) {
    const e = t - 0.01;
    return this.config.ignored_positions.filter((i) => e >= i && e < i + this.config.column_width);
  }
  unselect_all() {
    this.popup && this.popup.parent.classList.add("hide"), this.$container.querySelectorAll(".date-range-highlight").forEach((t) => t.classList.add("hide"));
  }
  view_is(t) {
    return typeof t == "string" ? this.config.view_mode.name === t : Array.isArray(t) ? t.some(view_is) : this.config.view_mode.name === t.name;
  }
  get_task(t) {
    return this.tasks.find((e) => e.id === t);
  }
  get_bar(t) {
    return this.bars.find((e) => e.task.id === t);
  }
  show_popup(t) {
    if (this.options.popup !== !1) {
      if (this.options.rtl) {
        const e = this.dates.length * this.config.column_width;
        t.x = e - t.x;
      }
      this.popup || (this.popup = new G(
        this.$popup_wrapper,
        this.options.popup,
        this
      )), this.popup.show(t);
    }
  }
  hide_popup() {
    this.popup && this.popup.hide();
  }
  trigger_event(t, e) {
    this.options["on_" + t] && this.options["on_" + t].apply(this, e);
  }
  view_is(t) {
    return this.options.view_mode.name === t;
  }
  getDateFromClick(t) {
    const e = this.$svg.getBoundingClientRect(), i = t.clientX - e.left, s = this.lowerTexts;
    if (!s.length)
      return null;
    const n = Math.floor(i / this.config.column_width), o = s[n];
    if (!o)
      return null;
    const a = o.className.match(/date_(\d{4}-\d{2}-\d{2})/);
    return a ? a[1] : null;
  }
  /**
   * Gets the oldest starting date from the list of tasks
   *
   * @returns Date
   * @memberof Gantt
   */
  get_oldest_starting_date() {
    return this.tasks.length ? this.tasks.map((t) => t._start).reduce(
      (t, e) => e <= t ? e : t
    ) : /* @__PURE__ */ new Date();
  }
  /**
   * Clear all elements from the parent svg element
   *
   * @memberof Gantt
   */
  clear() {
    var t, e, i, s, n, o, a, d, h, _;
    this.$svg.innerHTML = "", (e = (t = this.$header) == null ? void 0 : t.remove) == null || e.call(t), (s = (i = this.$side_header) == null ? void 0 : i.remove) == null || s.call(i), (o = (n = this.$current_highlight) == null ? void 0 : n.remove) == null || o.call(n), (d = (a = this.$extras) == null ? void 0 : a.remove) == null || d.call(a), (_ = (h = this.popup) == null ? void 0 : h.hide) == null || _.call(h);
  }
}
Q.VIEW_MODE = {
  HOUR: v[0],
  QUARTER_DAY: v[1],
  HALF_DAY: v[2],
  DAY: v[3],
  WEEK: v[4],
  MONTH: v[5],
  YEAR: v[6]
};
function K(r) {
  return r.name + "_" + Math.random().toString(36).slice(2, 12);
}
function X(r) {
  return r.replaceAll(" ", "_").replaceAll(":", "_").replaceAll(".", "_");
}
export {
  Q as default
};
