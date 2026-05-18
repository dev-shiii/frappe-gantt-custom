import date_utils from './date_utils';
import { $, createSVG } from './svg_utils';

import Arrow from './arrow';
import Bar from './bar';
import Popup from './popup';

import { DEFAULT_OPTIONS, DEFAULT_VIEW_MODES } from './defaults';

import './styles/gantt.css';

export default class Gantt {
    constructor(wrapper, tasks, options) {
        this.setup_wrapper(wrapper);
        this.setup_options(options);
        this.setup_tasks(tasks);
        this.change_view_mode();
        this.bind_events();
    }

    setup_wrapper(element) {
        let svg_element, wrapper_element;

        // CSS Selector is passed
        if (typeof element === 'string') {
            let el = document.querySelector(element);
            if (!el) {
                throw new ReferenceError(
                    `CSS selector "${element}" could not be found in DOM`,
                );
            }
            element = el;
        }

        // get the SVGElement
        if (element instanceof HTMLElement) {
            wrapper_element = element;
            svg_element = element.querySelector('svg');
        } else if (element instanceof SVGElement) {
            svg_element = element;
        } else {
            throw new TypeError(
                'Frappe Gantt only supports usage of a string CSS selector,' +
                    " HTML DOM element or SVG DOM element for the 'element' parameter",
            );
        }

        // svg element
        if (!svg_element) {
            // create it
            this.$svg = createSVG('svg', {
                append_to: wrapper_element,
                class: 'gantt',
            });
        } else {
            this.$svg = svg_element;
            this.$svg.classList.add('gantt');
        }

        // wrapper element
        this.$container = this.create_el({
            classes: 'gantt-container',
            append_to: this.$svg.parentElement,
        });

        this.$container.appendChild(this.$svg);
        this.$popup_wrapper = this.create_el({
            classes: 'popup-wrapper',
            append_to: this.$container,
        });
        
    }

    setup_options(options) {
        this.original_options = options;
        if (options?.view_modes) {
            options.view_modes = options.view_modes.map((mode) => {
                if (typeof mode === 'string') {
                    const predefined_mode = DEFAULT_VIEW_MODES.find(
                        (d) => d.name === mode,
                    );
                    if (!predefined_mode)
                        console.error(
                            `The view mode "${mode}" is not predefined in Frappe Gantt. Please define the view mode object instead.`,
                        );

                    return predefined_mode;
                }
                return mode;
            });
            // automatically set the view mode to the first option
            options.view_mode = options.view_modes[0];
        }
        this.options = { ...DEFAULT_OPTIONS, ...options };
        const CSS_VARIABLES = {
            'grid-height': 'container_height',
            'bar-height': 'bar_height',
            'lower-header-height': 'lower_header_height',
            'upper-header-height': 'upper_header_height',
        };
        for (let name in CSS_VARIABLES) {
            let setting = this.options[CSS_VARIABLES[name]];
            if (setting !== 'auto')
                this.$container.style.setProperty(
                    '--gv-' + name,
                    setting + 'px',
                );
        }

        this.config = {
            ignored_dates: [],
            ignored_positions: [],
            extend_by_units: 10,
        };

        if (typeof this.options.ignore !== 'function') {
            if (typeof this.options.ignore === 'string')
                this.options.ignore = [this.options.ignore];
            for (let option of this.options.ignore) {
                if (typeof option === 'function') {
                    this.config.ignored_function = option;
                    continue;
                }
                if (typeof option === 'string') {
                    if (option === 'weekend')
                        this.config.ignored_function = (d) =>
                            d.getDay() == 6 || d.getDay() == 0;
                    else this.config.ignored_dates.push(new Date(option + ' '));
                }
            }
        } else {
            this.config.ignored_function = this.options.ignore;
        }
        if (this.options.rtl && this.$container) {
        this.$container.classList.add('gantt-rtl');
    }
    }

    update_options(options) {
        this.setup_options({ ...this.original_options, ...options });
        this.change_view_mode(undefined, true);
    }

    setup_tasks(tasks) {
        this.tasks = tasks
            .map((task, i) => {
                if (!task.start) {
                    console.error(
                        `task "${task.id}" doesn't have a start date`,
                    );
                    return false;
                }

                task._start = date_utils.parse(task.start);
                if (task.end === undefined && task.duration !== undefined) {
                    task.end = task._start;
                    let durations = task.duration.split(' ');

                    durations.forEach((tmpDuration) => {
                        let { duration, scale } =
                            date_utils.parse_duration(tmpDuration);
                        task.end = date_utils.add(task.end, duration, scale);
                    });
                }
                if (!task.end) {
                    console.error(`task "${task.id}" doesn't have an end date`);
                    return false;
                }
                task._end = date_utils.parse(task.end);

                let diff = date_utils.diff(task._end, task._start, 'year');
                if (diff < 0) {
                    console.error(
                        `start of task can't be after end of task: in task "${task.id}"`,
                    );
                    return false;
                }

                // make task invalid if duration too large
                if (date_utils.diff(task._end, task._start, 'year') > 10) {
                    console.error(
                        `the duration of task "${task.id}" is too long (above ten years)`,
                    );
                    return false;
                }

                // cache index
                task._index = i;

                // if hours is not set, assume the last day is full day
                // e.g: 2018-09-09 becomes 2018-09-09 23:59:59
                const task_end_values = date_utils.get_date_values(task._end);
                if (task_end_values.slice(3).every((d) => d === 0)) {
                    task._end = date_utils.add(task._end, 24, 'hour');
                }

                // dependencies
                if (
                    typeof task.dependencies === 'string' ||
                    !task.dependencies
                ) {
                    let deps = [];
                    if (task.dependencies) {
                        deps = task.dependencies
                            .split(',')
                            .map((d) => d.trim().replaceAll(' ', '_'))
                            .filter((d) => d);
                    }
                    task.dependencies = deps;
                }

                // uids
                if (!task.id) {
                    task.id = generate_id(task);
                } else if (typeof task.id === 'string') {
                    task.id = task.id.replaceAll(' ', '_');
                } else {
                    task.id = `${task.id}`;
                }

                return task;
            })
            .filter((t) => t);

            this.tasks.forEach(t => { t._row = t._index; });

    if (this.options.pack_done_tasks) {
        this.apply_row_packing();
    } else {
        this._visual_row_count = this.tasks.length;
    }

        this.setup_dependencies();
    }

    setup_dependencies() {
        this.dependency_map = {};
        for (let t of this.tasks) {
            for (let d of t.dependencies) {
                this.dependency_map[d] = this.dependency_map[d] || [];
                this.dependency_map[d].push(t.id);
            }
        }
    }
    apply_row_packing() {
    const done_tasks = this.tasks.filter(t => t.done === true);
    const active_tasks = this.tasks.filter(t => t.done !== true);

    // Sort done tasks by start date for greedy bin-packing
    done_tasks.sort((a, b) => a._start - b._start);

    const packed_rows = []; // each element is an array of tasks in that row

    for (let task of done_tasks) {
        let placed = false;
        for (let rowIdx = 0; rowIdx < packed_rows.length; rowIdx++) {
            // Check time overlap with every task already in this row
            const overlaps = packed_rows[rowIdx].some(existing =>
                task._start < existing._end && existing._start < task._end
            );
            if (!overlaps) {
                packed_rows[rowIdx].push(task);
                task._row = rowIdx;
                placed = true;
                break;
            }
        }
        if (!placed) {
            packed_rows.push([task]);
            task._row = packed_rows.length - 1;
        }
    }

    // Active tasks keep original order, stacked below packed rows
    const offset = packed_rows.length;
    active_tasks.sort((a, b) => a._index - b._index);
    active_tasks.forEach((task, i) => {
        task._row = offset + i;
    });

    this._visual_row_count = offset + active_tasks.length;
}

    refresh(tasks) {
        this.setup_tasks(tasks);
        this.change_view_mode();
    }

    update_task(id, new_details) {
        let task = this.tasks.find((t) => t.id === id);
        let bar = this.bars[task._index];
        Object.assign(task, new_details);
        bar.refresh();
    }

    change_view_mode(mode = this.options.view_mode, maintain_pos = false) {
        if (typeof mode === 'string') {
            mode = this.options.view_modes.find((d) => d.name === mode);
        }
        let old_pos, old_scroll_op;
        if (maintain_pos) {
            old_pos = this.$container.scrollLeft;
            old_scroll_op = this.options.scroll_to;
            this.options.scroll_to = null;
        }
        this.options.view_mode = mode.name;
        this.config.view_mode = mode;
        this.update_view_scale(mode);
        this.setup_dates(maintain_pos);
        this.render();
        if (maintain_pos) {
            this.$container.scrollLeft = old_pos;
            this.options.scroll_to = old_scroll_op;
        }
        this.trigger_event('view_change', [mode]);
    }

    update_view_scale(mode) {
        let { duration, scale } = date_utils.parse_duration(mode.step);
        this.config.step = duration;
        this.config.unit = scale;
        this.config.column_width =
            this.options.column_width || mode.column_width || 45;
        this.$container.style.setProperty(
            '--gv-column-width',
            this.config.column_width + 'px',
        );
        this.config.header_height =
            this.options.lower_header_height +
            this.options.upper_header_height +
            10;
    }

    setup_dates(refresh = false) {
        this.setup_gantt_dates(refresh);
        this.setup_date_values();
    }

    setup_gantt_dates(refresh) {
        let gantt_start, gantt_end;
        if (!this.tasks.length) {
            gantt_start = new Date();
            gantt_end = new Date();
        }

        for (let task of this.tasks) {
            if (!gantt_start || task._start < gantt_start) {
                gantt_start = task._start;
            }
            if (!gantt_end || task._end > gantt_end) {
                gantt_end = task._end;
            }
        }

        gantt_start = date_utils.start_of(gantt_start, this.config.unit);
        gantt_end = date_utils.start_of(gantt_end, this.config.unit);

        if (!refresh) {
            if (!this.options.infinite_padding) {
                if (typeof this.config.view_mode.padding === 'string')
                    this.config.view_mode.padding = [
                        this.config.view_mode.padding,
                        this.config.view_mode.padding,
                    ];

                let [padding_start, padding_end] =
                    this.config.view_mode.padding.map(
                        date_utils.parse_duration,
                    );
                this.gantt_start = date_utils.add(
                    gantt_start,
                    -padding_start.duration,
                    padding_start.scale,
                );
                this.gantt_end = date_utils.add(
                    gantt_end,
                    padding_end.duration,
                    padding_end.scale,
                );
            } else {
                this.gantt_start = date_utils.add(
                    gantt_start,
                    -this.config.extend_by_units * 3,
                    this.config.unit,
                );
                this.gantt_end = date_utils.add(
                    gantt_end,
                    this.config.extend_by_units * 3,
                    this.config.unit,
                );
            }
        }
        this.config.date_format =
            this.config.view_mode.date_format || this.options.date_format;
        this.gantt_start.setHours(0, 0, 0, 0);
    }

    setup_date_values() {
        let cur_date = this.gantt_start;
        this.dates = [cur_date];

        while (cur_date < this.gantt_end) {
            cur_date = date_utils.add(
                cur_date,
                this.config.step,
                this.config.unit,
            );
            this.dates.push(cur_date);
        }
    }

    bind_events() {
        this.bind_grid_click();
        this.bind_holiday_labels();
        this.bind_bar_events();
    }

    render() {
        this.clear();
        this.inject_rtl_styles();
        this.setup_layers();
        this.make_grid();
        this.make_dates();
        this.make_grid_extras();
        this.make_bars();
        this.make_arrows();
        this.map_arrows_on_bars();
        this.set_dimensions();
        this.set_scroll_position(this.options.scroll_to);
    }
    inject_rtl_styles() {
    if (!this.options.rtl) return;
    const id = 'gantt-rtl-styles';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
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
    `;
    document.head.appendChild(style);
}

    setup_layers() {
        this.layers = {};
        const layers = ['grid', 'arrow', 'progress', 'bar'];
        // make group layers
        for (let layer of layers) {
            this.layers[layer] = createSVG('g', {
                class: layer,
                append_to: this.$svg,
            });
        }
        this.$extras = this.create_el({
            classes: 'extras',
            append_to: this.$container,
        });
        this.$adjust = this.create_el({
            classes: 'adjust hide',
            append_to: this.$extras,
            type: 'button',
        });
        this.$adjust.innerHTML = '&larr;';
    }

    make_grid() {
        this.make_grid_background();
        this.make_grid_rows();
        this.make_grid_header();
        this.make_side_header();
    }

    make_grid_extras() {
        this.make_grid_highlights();
        this.make_grid_ticks();
    }

   make_grid_background() {
    const grid_width = this.dates.length * this.config.column_width;
    const row_count = this._visual_row_count || this.tasks.length; // <-- CHANGED
    const grid_height = Math.max(
        this.config.header_height +
            this.options.padding +
            (this.options.bar_height + this.options.padding) *
                row_count -                                        // <-- CHANGED
                10,
        this.options.container_height !== 'auto'
            ? this.options.container_height
            : 0,
    );

        createSVG('rect', {
            x: 0,
            y: 0,
            width: grid_width,
            height: grid_height,
            class: 'grid-background',
            append_to: this.$svg,
        });

        $.attr(this.$svg, {
            height: grid_height,
            width: '100%',
        });
        this.grid_height = grid_height;
        if (this.options.container_height === 'auto')
            this.$container.style.height = grid_height + 'px';
    }

    make_grid_rows() {
        const rows_layer = createSVG('g', { append_to: this.layers.grid });

        const row_width = this.dates.length * this.config.column_width;
        const row_height = this.options.bar_height + this.options.padding;

        let y = this.config.header_height;
        for (
            let y = this.config.header_height;
            y < this.grid_height;
            y += row_height
        ) {
            createSVG('rect', {
                x: 0,
                y,
                width: row_width,
                height: row_height,
                class: 'grid-row',
                append_to: rows_layer,
            });
        }
    }

    make_grid_header() {
        this.$header = this.create_el({
            width: this.dates.length * this.config.column_width,
            classes: 'grid-header',
            append_to: this.$container,
        });

        this.$upper_header = this.create_el({
            classes: 'upper-header',
            append_to: this.$header,
        });
        this.$lower_header = this.create_el({
            classes: 'lower-header',
            append_to: this.$header,
        });
    }

    make_side_header() {
        this.$side_header = this.create_el({ classes: 'side-header' });
        this.$upper_header.prepend(this.$side_header);

        // Create view mode change select
        if (this.options.view_mode_select) {
            const $select = document.createElement('select');
            $select.classList.add('viewmode-select');

            const $el = document.createElement('option');
            $el.selected = true;
            $el.disabled = true;
            $el.textContent = 'Mode';
            $select.appendChild($el);

            for (const mode of this.options.view_modes) {
                const $option = document.createElement('option');
                $option.value = mode.name;
                $option.textContent = mode.name;
                if (mode.name === this.config.view_mode.name)
                    $option.selected = true;
                $select.appendChild($option);
            }

            $select.addEventListener(
                'change',
                function () {
                    this.change_view_mode($select.value, true);
                }.bind(this),
            );
            this.$side_header.appendChild($select);
        }

        // Create today button
        if (this.options.today_button) {
            let $today_button = document.createElement('button');
            $today_button.classList.add('today-button');
            $today_button.textContent = 'Today';
            $today_button.onclick = this.scroll_current.bind(this);
            this.$side_header.prepend($today_button);
            this.$today_button = $today_button;
        }
    }

    make_grid_ticks() {
        if (this.options.lines === 'none') return;
        let tick_x = 0;
        let tick_y = this.config.header_height;
        let tick_height = this.grid_height - this.config.header_height;

        let $lines_layer = createSVG('g', {
            class: 'lines_layer',
            append_to: this.layers.grid,
        });

        let row_y = this.config.header_height;

        const row_width = this.dates.length * this.config.column_width;
        const row_height = this.options.bar_height + this.options.padding;
        if (this.options.lines !== 'vertical') {
            for (
                let y = this.config.header_height;
                y < this.grid_height;
                y += row_height
            ) {
                createSVG('line', {
                    x1: 0,
                    y1: row_y + row_height,
                    x2: row_width,
                    y2: row_y + row_height,
                    class: 'row-line',
                    append_to: $lines_layer,
                });
                row_y += row_height;
            }
        }
        if (this.options.lines === 'horizontal') return;

        for (let date of this.dates) {
            let tick_class = 'tick';
            if (
                this.config.view_mode.thick_line &&
                this.config.view_mode.thick_line(date)
            ) {
                tick_class += ' thick';
            }

            createSVG('path', {
                d: `M ${tick_x} ${tick_y} v ${tick_height}`,
                class: tick_class,
                append_to: this.layers.grid,
            });

            if (this.view_is('month')) {
                tick_x +=
                    (date_utils.get_days_in_month(date) *
                        this.config.column_width) /
                    30;
            } else if (this.view_is('year')) {
                tick_x +=
                    (date_utils.get_days_in_year(date) *
                        this.config.column_width) /
                    365;
            } else {
                tick_x += this.config.column_width;
            }
        }
    }

    highlight_holidays() {
        let labels = {};
        if (!this.options.holidays) return;

        for (let color in this.options.holidays) {
            let check_highlight = this.options.holidays[color];
            if (check_highlight === 'weekend')
                check_highlight = this.options.is_weekend;
            let extra_func;

            if (typeof check_highlight === 'object') {
                let f = check_highlight.find((k) => typeof k === 'function');
                if (f) {
                    extra_func = f;
                }
                if (this.options.holidays.name) {
                    let dateObj = new Date(check_highlight.date + ' ');
                    check_highlight = (d) => dateObj.getTime() === d.getTime();
                    labels[dateObj] = check_highlight.name;
                } else {
                    check_highlight = (d) =>
                        this.options.holidays[color]
                            .filter((k) => typeof k !== 'function')
                            .map((k) => {
                                if (k.name) {
                                    let dateObj = new Date(k.date + ' ');
                                    labels[dateObj] = k.name;
                                    return dateObj.getTime();
                                }
                                return new Date(k + ' ').getTime();
                            })
                            .includes(d.getTime());
                }
            }
            for (
                let d = new Date(this.gantt_start);
                d <= this.gantt_end;
                d.setDate(d.getDate() + 1)
            ) {
                if (
                    this.config.ignored_dates.find(
                        (k) => k.getTime() == d.getTime(),
                    ) ||
                    (this.config.ignored_function &&
                        this.config.ignored_function(d))
                )
                    continue;
                const is_holiday =
                    check_highlight(d) || (extra_func && extra_func(d));
                const x =
                    (date_utils.diff(d, this.gantt_start, this.config.unit) /
                        this.config.step) *
                    this.config.column_width;
                const height = this.grid_height - this.config.header_height;
                const d_formatted = date_utils
                    .format(d, 'YYYY-MM-DD', this.options.language)
                    .replace(' ', '_');
                const config = {
                    x: Math.round(x),
                    y: this.config.header_height,
                    width:
                        this.config.column_width /
                        date_utils.convert_scales(
                            this.config.view_mode.step,
                            'day',
                        ),
                    height,
                    append_to: this.layers.grid,
                };
                let column;
                if (is_holiday) {
                    if (labels[d]) {
                        let label = this.create_el({
                            classes: 'holiday-label ' + 'label_' + d_formatted,
                            append_to: this.$extras,
                        });
                        label.textContent = labels[d];
                    }
                    column = createSVG('rect', {
                        ...config,
                        class:
                            'holiday-highlight ' +
                            d_formatted +
                            (this.options.hover_on_date ? ' grid-column' : ''),
                        style: `fill: ${color};`,
                        append_to: this.layers.grid,
                    });
                } else if (this.options.hover_on_date) {
                    column = createSVG('rect', {
                        ...config,
                        class: 'grid-column',
                    });
                }
            }
        }
    }

    /**
     * Compute the horizontal x-axis distance and associated date for the current date and view.
     *
     * @returns Object containing the x-axis distance and date of the current date, or null if the current date is out of the gantt range.
     */
    highlight_current() {
        const res = this.get_closest_date();
        if (!res || !res[1]) return;

        const [_, el] = res;
        el.classList.add('current-date-highlight');

        const diff_in_units = date_utils.diff(
            new Date(),
            this.gantt_start,
            this.config.unit,
        );

        let left =
    (diff_in_units / this.config.step) * this.config.column_width;
            if (this.options.rtl) {
    const total_width = this.dates.length * this.config.column_width;
    left = total_width - left;
}

        this.$current_highlight = this.create_el({
            top: this.config.header_height - 6,
    left: left - 2.5,
            height: this.grid_height - this.config.header_height,
            classes: 'current-highlight',
            append_to: this.$container,
        });
        this.$current_ball_highlight = this.create_el({
            top: this.config.header_height - 6,
            left: left - 2.5,
            width: 6,
            height: 6,
            classes: 'current-ball-highlight',
            append_to: this.$header,
        });
    }

    make_grid_highlights() {
    this.highlight_holidays();
    this.config.ignored_positions = [];

    const row_count = this._visual_row_count || this.tasks.length; // <-- CHANGED
    const height =
        (this.options.bar_height + this.options.padding) *
        row_count;
            
        this.layers.grid.innerHTML += `<pattern id="diagonalHatch" patternUnits="userSpaceOnUse" width="4" height="4">
          <path d="M-1,1 l2,-2
                   M0,4 l4,-4
                   M3,5 l2,-2"
                style="stroke:grey; stroke-width:0.3" />
        </pattern>`;

        for (
            let d = new Date(this.gantt_start);
            d <= this.gantt_end;
            d.setDate(d.getDate() + 1)
        ) {
            if (
                !this.config.ignored_dates.find(
                    (k) => k.getTime() == d.getTime(),
                ) &&
                (!this.config.ignored_function ||
                    !this.config.ignored_function(d))
            )
                continue;
            
            let diff =
                date_utils.convert_scales(
                    date_utils.diff(d, this.gantt_start) + 'd',
                    this.config.unit,
                ) / this.config.step;

            // This is the exact X coordinate for the start of the day
            let x_pos = diff * this.config.column_width;
            this.config.ignored_positions.push(x_pos);
            
            let is_specific_holiday = false;
            if (this.options.is_holiday && this.options.is_holiday(d)) {
                is_specific_holiday = true;
            }

            // Calculate exact pixel width of 1 day based on current zoom
            let unitToDays = { hour: 1/24, day: 1, month: 30, year: 365 };
            let daysInUnit = unitToDays[this.config.unit] || 1;
            let day_width = (this.config.column_width / this.config.step) / daysInUnit;

            // Force a minimum width of 4px so it never vanishes into anti-aliasing
            let render_width = Math.max(day_width, 4);

            // --- COLOR LOGIC BAKED DIRECTLY INTO THE LIBRARY ---
            let opacity = day_width < 10 ? '0.45' : '0.12';
            let holidayColor = `rgba(54, 162, 235, ${opacity})`;
            
            let fillStyle = is_specific_holiday ? `fill: ${holidayColor};` : 'fill: url(#diagonalHatch);';
            // ---------------------------------------------------

            // Set up the SVG configuration
            createSVG('rect', {
                x: x_pos,
                y: this.config.header_height,
                width: render_width, 
                height: height,
                class: is_specific_holiday ? 'ignored-bar holiday-bar' : 'ignored-bar',
                style: fillStyle,
                append_to: this.$svg,
            });
        }

        const highlightDimensions = this.highlight_current(
            this.config.view_mode,
        );

        if (!highlightDimensions) return;
    }

    create_el({ left, top, width, height, id, classes, append_to, type }) {
        let $el = document.createElement(type || 'div');
        for (let cls of classes.split(' ')) $el.classList.add(cls);
        $el.style.top = top + 'px';
        $el.style.left = left + 'px';
        if (id) $el.id = id;
        if (width) $el.style.width = width + 'px';
        if (height) $el.style.height = height + 'px';
        if (append_to) append_to.appendChild($el);
        return $el;
    }

    make_dates() {
        this.get_dates_to_draw().forEach((date, i) => {
            if (date.lower_text) {
                let $lower_text = this.create_el({
                    left: date.x,
                    top: date.lower_y,
                    classes: 'lower-text date_' + sanitize(date.formatted_date),
                    append_to: this.$lower_header,
                });
                $lower_text.innerText = date.lower_text;
            }

            if (date.upper_text) {
                let $upper_text = this.create_el({
                    left: date.x,
                    top: date.upper_y,
                    classes: 'upper-text',
                    append_to: this.$upper_header,
                });
                $upper_text.innerText = date.upper_text;
            }
        });
        this.upperTexts = Array.from(
            this.$container.querySelectorAll('.upper-text'),
        );
        this.lowerTexts = Array.from(
            this.$container.querySelectorAll('.lower-text'),
        );
    }

    get_dates_to_draw() {
        let last_date_info = null;
        const dates = this.dates.map((date, i) => {
            const d = this.get_date_info(date, last_date_info, i);
            last_date_info = d;
            return d;
        });
        return dates;
    }

    get_date_info(date, last_date_info) {
        let last_date = last_date_info ? last_date_info.date : null;

        let column_width = this.config.column_width;

        const x = last_date_info
            ? last_date_info.x + last_date_info.column_width
            : 0;

        let upper_text = this.config.view_mode.upper_text;
        let lower_text = this.config.view_mode.lower_text;

        if (!upper_text) {
            this.config.view_mode.upper_text = () => '';
        } else if (typeof upper_text === 'string') {
            this.config.view_mode.upper_text = (date) =>
                date_utils.format(date, upper_text, this.options.language);
        }

        if (!lower_text) {
            this.config.view_mode.lower_text = () => '';
        } else if (typeof lower_text === 'string') {
            this.config.view_mode.lower_text = (date) =>
                date_utils.format(date, lower_text, this.options.language);
        }

        return {
            date,
            formatted_date: sanitize(
                date_utils.format(
                    date,
                    this.config.date_format,
                    this.options.language,
                ),
            ),
            column_width: this.config.column_width,
            x,
            upper_text: this.config.view_mode.upper_text(
                date,
                last_date,
                this.options.language,
            ),
            lower_text: this.config.view_mode.lower_text(
                date,
                last_date,
                this.options.language,
            ),
            upper_y: 17,
            lower_y: this.options.upper_header_height + 5,
        };
    }

    make_bars() {
        this.bars = this.tasks.map((task) => {
            const bar = new Bar(this, task);
            this.layers.bar.appendChild(bar.group);
            return bar;
        });
    }

    make_arrows() {
        this.arrows = [];
        for (let task of this.tasks) {
            let arrows = [];
            arrows = task.dependencies
                .map((task_id) => {
                    const dependency = this.get_task(task_id);
                    if (!dependency) return;
                    const arrow = new Arrow(
                        this,
                        this.bars[dependency._index], // from_task
                        this.bars[task._index], // to_task
                    );
                    this.layers.arrow.appendChild(arrow.element);
                    return arrow;
                })
                .filter(Boolean); // filter falsy values
            this.arrows = this.arrows.concat(arrows);
        }
    }

    map_arrows_on_bars() {
        for (let bar of this.bars) {
            bar.arrows = this.arrows.filter((arrow) => {
                return (
                    arrow.from_task.task.id === bar.task.id ||
                    arrow.to_task.task.id === bar.task.id
                );
            });
        }
    }

    set_dimensions() {
        const { width: cur_width } = this.$svg.getBoundingClientRect();
        const actual_width = this.$svg.querySelector('.grid .grid-row')
            ? this.$svg.querySelector('.grid .grid-row').getAttribute('width')
            : 0;
        if (cur_width < actual_width) {
            this.$svg.setAttribute('width', actual_width);
        }
    }

    set_scroll_position(date) {
        if (this.options.infinite_padding && (!date || date === 'start')) {
            let [min_start, ..._] = this.get_start_end_positions();
            this.$container.scrollLeft = min_start;
            return;
        }
        if (!date || date === 'start') {
            date = this.gantt_start;
        } else if (date === 'end') {
            date = this.gantt_end;
        } else if (date === 'today') {
            return this.scroll_current();
        } else if (typeof date === 'string') {
            date = date_utils.parse(date);
        }

        // Weird bug where infinite padding results in one day offset in scroll
        // Related to header-body displacement
        const units_since_first_task = date_utils.diff(
            date,
            this.gantt_start,
            this.config.unit,
        );
        const scroll_pos =
            (units_since_first_task / this.config.step) *
            this.config.column_width;

        this.$container.scrollTo({
            left: scroll_pos - this.config.column_width / 6,
            behavior: 'smooth',
        });

        // Calculate current scroll position's upper text
        if (this.$current) {
            this.$current.classList.remove('current-upper');
        }

        this.current_date = date_utils.add(
            this.gantt_start,
            this.$container.scrollLeft / this.config.column_width,
            this.config.unit,
        );

        let current_upper = this.config.view_mode.upper_text(
            this.current_date,
            null,
            this.options.language,
        );
        let $el = this.upperTexts.find(
            (el) => el.textContent === current_upper,
        );

        // Recalculate
        this.current_date = date_utils.add(
            this.gantt_start,
            (this.$container.scrollLeft + $el.clientWidth) /
                this.config.column_width,
            this.config.unit,
        );
        current_upper = this.config.view_mode.upper_text(
            this.current_date,
            null,
            this.options.language,
        );
        $el = this.upperTexts.find((el) => el.textContent === current_upper);
        $el.classList.add('current-upper');
        this.$current = $el;
    }

    scroll_current() {
        let res = this.get_closest_date();
        if (res) this.set_scroll_position(res[0]);
    }

    get_closest_date() {
        let now = new Date();
        if (now < this.gantt_start || now > this.gantt_end) return null;

        let current = new Date(),
            el = this.$container.querySelector(
                '.date_' +
                    sanitize(
                        date_utils.format(
                            current,
                            this.config.date_format,
                            this.options.language,
                        ),
                    ),
            );

        // safety check to prevent infinite loop
        let c = 0;
        while (!el && c < this.config.step) {
            current = date_utils.add(current, -1, this.config.unit);
            el = this.$container.querySelector(
                '.date_' +
                    sanitize(
                        date_utils.format(
                            current,
                            this.config.date_format,
                            this.options.language,
                        ),
                    ),
            );
            c++;
        }
        return [
            new Date(
                date_utils.format(
                    current,
                    this.config.date_format,
                    this.options.language,
                ) + ' ',
            ),
            el,
        ];
    }

    bind_grid_click() {
        $.on(
            this.$container,
            'click',
            '.grid-row, .grid-header, .ignored-bar, .holiday-highlight',
            () => {
                this.unselect_all();
                this.hide_popup();
            },
        );
    }

    bind_holiday_labels() {
        const $highlights =
            this.$container.querySelectorAll('.holiday-highlight');
        for (let h of $highlights) {
            const label = this.$container.querySelector(
                '.label_' + h.classList[1],
            );
            if (!label) continue;
            let timeout;
            h.onmouseenter = (e) => {
                timeout = setTimeout(() => {
                    label.classList.add('show');
                    label.style.left = (e.offsetX || e.layerX) + 'px';
                    label.style.top = (e.offsetY || e.layerY) + 'px';
                }, 300);
            };

            h.onmouseleave = (e) => {
                clearTimeout(timeout);
                label.classList.remove('show');
            };
        }
    }

    get_start_end_positions() {
        if (!this.bars.length) return [0, 0, 0];
        let { x, width } = this.bars[0].group.getBBox();
        let min_start = x;
        let max_start = x;
        let max_end = x + width;
        Array.prototype.forEach.call(this.bars, function ({ group }, i) {
            let { x, width } = group.getBBox();
            if (x < min_start) min_start = x;
            if (x > max_start) max_start = x;
            if (x + width > max_end) max_end = x + width;
        });
        return [min_start, max_start, max_end];
    }

    bind_bar_events() {
        let is_dragging = false;
        let x_on_start = 0;
        let x_on_scroll_start = 0;
        let is_resizing_left = false;
        let is_resizing_right = false;
        let parent_bar_id = null;
        let bars = []; // instanceof Bar
        this.bar_being_dragged = null;

        const action_in_progress = () =>
            is_dragging || is_resizing_left || is_resizing_right;

        this.$svg.onclick = (e) => {
            if (e.target.classList.contains('grid-row')) this.unselect_all();
        };

        let pos = 0;
        $.on(this.$svg, 'mousemove', '.bar-wrapper, .handle', (e) => {
            if (
                this.bar_being_dragged === false &&
                Math.abs((e.offsetX || e.layerX) - pos) > 10
            )
                this.bar_being_dragged = true;
        });

        $.on(this.$svg, 'mousedown', '.grid-column', (e) => {
            this.trigger_event('date_click', [this.getDateFromClick(e)]);
        });

        $.on(this.$svg, 'mousedown', '.bar-wrapper, .handle', (e, element) => {
            const bar_wrapper = $.closest('.bar-wrapper', element);
            if (element.classList.contains('left')) {
                is_resizing_left = true;
                element.classList.add('visible');
            } else if (element.classList.contains('right')) {
                is_resizing_right = true;
                element.classList.add('visible');
            } else if (element.classList.contains('bar-wrapper')) {
                is_dragging = true;
            }

            if (this.popup) this.popup.hide();

            x_on_start = e.offsetX || e.layerX;

            parent_bar_id = bar_wrapper.getAttribute('data-id');

            // COLLISION-BASED CASCADE: at mousedown, only the grabbed bar is in
            // the active drag set. Dependent/parent bars are added DYNAMICALLY
            // during mousemove only when the moving bar physically touches them.
            // This replaces frappe's "blanket cascade" (which used to shift the
            // entire dependency tree even without collision) with the cleaner
            // user-expected behavior: push only when the dragged bar actually
            // bumps into a dependent or parent.
            //
            // We still snapshot ALL tasks in the project so we can quickly look
            // them up for collision detection. They are NOT in `bars[]` yet —
            // they are bystanders until/unless the drag pushes them.
            bars = [this.get_bar(parent_bar_id)];

            // Pre-snapshot every OTHER bar's original x/width so when we
            // dynamically push them during mousemove, we know where they
            // started. The bar itself stores .ox/.owidth/.finaldx already
            // for the grabbed bar (set below); we mirror that for everyone
            // so collision math is uniform.
            this._all_bars_snapshot = this.bars.map((b) => {
                const $b = b.$bar;
                return {
                    bar: b,
                    id: b.task.id,
                    ox: $b.getX(),
                    owidth: $b.getWidth(),
                    pushed: false, // true once this bar joins the active drag
                };
            });

            this.bar_being_dragged = false;
            pos = x_on_start;

            bars.forEach((bar) => {
                const $bar = bar.$bar;
                $bar.ox = $bar.getX();
                $bar.oy = $bar.getY();
                $bar.owidth = $bar.getWidth();
                $bar.finaldx = 0;
            });
        });

        if (this.options.infinite_padding) {
            let extended = false;
            $.on(this.$container, 'mousewheel', (e) => {
                let trigger = this.$container.scrollWidth / 2;
                if (!extended && e.currentTarget.scrollLeft <= trigger) {
                    let old_scroll_left = e.currentTarget.scrollLeft;
                    extended = true;

                    this.gantt_start = date_utils.add(
                        this.gantt_start,
                        -this.config.extend_by_units,
                        this.config.unit,
                    );
                    this.setup_date_values();
                    this.render();
                    e.currentTarget.scrollLeft =
                        old_scroll_left +
                        this.config.column_width * this.config.extend_by_units;
                    setTimeout(() => (extended = false), 300);
                }

                if (
                    !extended &&
                    e.currentTarget.scrollWidth -
                        (e.currentTarget.scrollLeft +
                            e.currentTarget.clientWidth) <=
                        trigger
                ) {
                    let old_scroll_left = e.currentTarget.scrollLeft;
                    extended = true;
                    this.gantt_end = date_utils.add(
                        this.gantt_end,
                        this.config.extend_by_units,
                        this.config.unit,
                    );
                    this.setup_date_values();
                    this.render();
                    e.currentTarget.scrollLeft = old_scroll_left;
                    setTimeout(() => (extended = false), 300);
                }
            });
        }

        $.on(this.$container, 'scroll', (e) => {
            let localBars = [];
            const ids = this.bars.map(({ group }) =>
                group.getAttribute('data-id'),
            );
            let dx;
            if (x_on_scroll_start) {
                dx = e.currentTarget.scrollLeft - x_on_scroll_start;
            }

            // Calculate current scroll position's upper text
            this.current_date = date_utils.add(
                this.gantt_start,
                (e.currentTarget.scrollLeft / this.config.column_width) *
                    this.config.step,
                this.config.unit,
            );

            let current_upper = this.config.view_mode.upper_text(
                this.current_date,
                null,
                this.options.language,
            );
            let $el = this.upperTexts.find(
                (el) => el.textContent === current_upper,
            );

            // Recalculate for smoother experience
            this.current_date = date_utils.add(
                this.gantt_start,
                ((e.currentTarget.scrollLeft + $el.clientWidth) /
                    this.config.column_width) *
                    this.config.step,
                this.config.unit,
            );
            current_upper = this.config.view_mode.upper_text(
                this.current_date,
                null,
                this.options.language,
            );
            $el = this.upperTexts.find(
                (el) => el.textContent === current_upper,
            );

            if ($el !== this.$current) {
                if (this.$current)
                    this.$current.classList.remove('current-upper');

                $el.classList.add('current-upper');
                this.$current = $el;
            }

            x_on_scroll_start = e.currentTarget.scrollLeft;
            let [min_start, max_start, max_end] =
                this.get_start_end_positions();

            if (x_on_scroll_start > max_end + 100) {
                this.$adjust.innerHTML = '&larr;';
                this.$adjust.classList.remove('hide');
                this.$adjust.onclick = () => {
                    this.$container.scrollTo({
                        left: max_start,
                        behavior: 'smooth',
                    });
                };
            } else if (
                x_on_scroll_start + e.currentTarget.offsetWidth <
                min_start - 100
            ) {
                this.$adjust.innerHTML = '&rarr;';
                this.$adjust.classList.remove('hide');
                this.$adjust.onclick = () => {
                    this.$container.scrollTo({
                        left: min_start,
                        behavior: 'smooth',
                    });
                };
            } else {
                this.$adjust.classList.add('hide');
            }

            if (dx) {
                localBars = ids.map((id) => this.get_bar(id));
                if (this.options.auto_move_label) {
                    localBars.forEach((bar) => {
                        bar.update_label_position_on_horizontal_scroll({
                            x: dx,
                            sx: e.currentTarget.scrollLeft,
                        });
                    });
                }
            }
        });

        $.on(this.$svg, 'mousemove', (e) => {
            if (!action_in_progress()) return;
            const dx = (e.offsetX || e.layerX) - x_on_start;

            this.hide_popup();

            const main_bar = bars[0];
            main_bar.$bar.finaldx = this.get_snap_position(dx, main_bar.$bar.ox);

            if (is_resizing_left) {
                if (parent_bar_id === main_bar.task.id) {
                    main_bar.update_bar_position({
                        x: main_bar.$bar.ox + main_bar.$bar.finaldx,
                        width: main_bar.$bar.owidth - main_bar.$bar.finaldx,
                    });
                }
            } else if (is_resizing_right) {
                if (parent_bar_id === main_bar.task.id) {
                    main_bar.update_bar_position({
                        width: main_bar.$bar.owidth + main_bar.$bar.finaldx,
                    });
                }
            } else if (is_dragging && !this.options.readonly && !this.options.readonly_dates) {
                main_bar.update_bar_position({ x: main_bar.$bar.ox + main_bar.$bar.finaldx });
            }

            // ---------------------------------------------------------------
            // COLLISION-BASED CASCADE (replaces frappe's blanket cascade)
            //
            // Rules (per user spec):
            //   - Forward drag: if grabbed bar's END crosses into a direct
            //     CHILD's range, push that child forward (snap to grabbed-end,
            //     hop over holidays/weekends via get_safe_x).
            //   - That pushed child can in turn collide with ITS child →
            //     cascade forward through the chain, one collision at a time.
            //   - Backward drag: symmetric — if grabbed bar's START crosses
            //     into a direct PARENT's range, push the parent backward.
            //     Pushed parents can collide with their parents → cascade.
            //   - Bars that aren't in a collision chain stay put.
            //
            // Holiday/off_day awareness comes from get_safe_x, which calls
            // options.is_weekend (covers off_days like Fri/Sat) and
            // options.is_holiday (covers factory_settings.holidays array).
            // ---------------------------------------------------------------
            if (this.options.move_dependencies && !this.options.readonly && !this.options.readonly_dates) {
                if (!is_resizing_left && !is_resizing_right) {
                    const is_dragging_right = main_bar.$bar.finaldx >= 0;
                    const grabbed_id = main_bar.task.id;

                    // Build a quick lookup from bar id → snapshot entry so
                    // collision math always uses original positions, not the
                    // already-pushed positions (which would compound errors).
                    const snap_by_id = {};
                    this._all_bars_snapshot.forEach((s) => { snap_by_id[s.id] = s; });

                    // Recursive collision propagation. `pusher` is the bar
                    // doing the pushing (just moved). We find direct
                    // dependents/parents that it now overlaps and shift them,
                    // then recurse from each newly-shifted bar.
                    //
                    // We track visited ids in this drag pass so we never
                    // double-process a bar (avoids infinite loop if the
                    // dependency graph has cycles or diamond shapes).
                    const visited = new Set([grabbed_id]);

                    const propagate_forward = (pusher_bar) => {
                        const pusher_end_x =
                            pusher_bar.$bar.getX() + pusher_bar.$bar.getWidth();
                        const pusher_id = pusher_bar.task.id;

                        // Find direct children of `pusher`: any task whose
                        // dependencies array contains pusher_id.
                        const child_ids = this.dependency_map[pusher_id] || [];

                        for (const child_id of child_ids) {
                            if (visited.has(child_id)) continue;
                            const child_snap = snap_by_id[child_id];
                            if (!child_snap) continue;
                            const child_bar = child_snap.bar;

                            // Use the child's CURRENT position to detect
                            // collision. (If a previous pass already moved it,
                            // we want the live position; if not, this equals
                            // its original ox.)
                            const child_start_x = child_bar.$bar.getX();

                            // Collision: pusher_end has crossed into child_start.
                            // Strict-greater so a perfect edge-touch
                            // (end === start) does NOT trigger a push —
                            // matches user's example: 1=15→16 doesn't push 2=18.
                            if (pusher_end_x > child_start_x) {
                                visited.add(child_id);

                                // Target: place child's start exactly at
                                // pusher's end, then nudge forward over any
                                // holiday/off-day.
                                let target_x = pusher_end_x;
                                target_x = this.get_safe_x(target_x, 1);

                                // Only move if it's actually a forward shift
                                // (defensive — should always be true here).
                                if (target_x > child_snap.ox) {
                                    child_snap.pushed = true;
                                    child_bar.$bar.finaldx = target_x - child_snap.ox;
                                    child_bar.update_bar_position({ x: target_x });

                                    // Recurse — this child may now hit ITS children.
                                    propagate_forward(child_bar);
                                }
                            } else if (child_snap.pushed) {
                                // Pusher backed off; if we previously pushed
                                // this child, return it to its original spot.
                                child_snap.pushed = false;
                                child_bar.$bar.finaldx = 0;
                                child_bar.update_bar_position({ x: child_snap.ox });
                                // Also revert anyone we cascaded from it.
                                this._revert_downstream(child_id, snap_by_id, visited);
                            }
                        }
                    };

                    const propagate_backward = (pusher_bar) => {
                        const pusher_start_x = pusher_bar.$bar.getX();
                        const pusher_id = pusher_bar.task.id;

                        // Find direct parents of `pusher`: pusher's own
                        // dependencies array IS its parents.
                        const parent_ids = pusher_bar.task.dependencies || [];

                        for (const parent_id of parent_ids) {
                            if (visited.has(parent_id)) continue;
                            const parent_snap = snap_by_id[parent_id];
                            if (!parent_snap) continue;
                            const parent_bar = parent_snap.bar;

                            const parent_end_x =
                                parent_bar.$bar.getX() + parent_bar.$bar.getWidth();

                            // Collision: pusher_start has crossed back into
                            // parent_end. Strict-less for the same edge-touch
                            // reason as forward.
                            if (pusher_start_x < parent_end_x) {
                                visited.add(parent_id);

                                // Target: place parent's END exactly at pusher's
                                // start → parent_start = pusher_start - parent_width.
                                let target_x = pusher_start_x - parent_bar.$bar.getWidth();
                                target_x = this.get_safe_x(target_x, -1);

                                if (target_x < parent_snap.ox) {
                                    parent_snap.pushed = true;
                                    parent_bar.$bar.finaldx = target_x - parent_snap.ox;
                                    parent_bar.update_bar_position({ x: target_x });

                                    // Recurse — this parent may now hit ITS parents.
                                    propagate_backward(parent_bar);
                                }
                            } else if (parent_snap.pushed) {
                                parent_snap.pushed = false;
                                parent_bar.$bar.finaldx = 0;
                                parent_bar.update_bar_position({ x: parent_snap.ox });
                                this._revert_upstream(parent_id, snap_by_id, visited);
                            }
                        }
                    };

                    if (is_dragging_right) {
                        propagate_forward(main_bar);
                    } else {
                        propagate_backward(main_bar);
                    }
                }
            }
        });

        document.addEventListener('mouseup', () => {
            is_dragging = false;
            is_resizing_left = false;
            is_resizing_right = false;
            this.$container
                .querySelector('.visible')
                ?.classList?.remove?.('visible');
        });

        $.on(this.$svg, 'mouseup', (e) => {
            this.bar_being_dragged = null;

            // Fire date_changed for the grabbed bar (always in bars[]).
            bars.forEach((bar) => {
                const $bar = bar.$bar;
                if (!$bar.finaldx) return;
                bar.date_changed();
                bar.compute_progress();
                bar.set_action_completed();
            });

            // Also fire date_changed for any bars the collision cascade
            // pushed during this drag. The wrapper's on_date_change handler
            // already filters cascaded events out via isPrimary, so these
            // events are still harmless — but firing them keeps frappe's
            // internal _start/_end on each task in sync with the on-screen
            // position before the upcoming silent refresh.
            if (this._all_bars_snapshot) {
                this._all_bars_snapshot.forEach((snap) => {
                    if (!snap.pushed) return;
                    snap.bar.date_changed();
                });
                this._all_bars_snapshot = null;
            }
        });

        this.bind_bar_progress();
    }

    bind_bar_progress() {
        let x_on_start = 0;
        let is_resizing = null;
        let bar = null;
        let $bar_progress = null;
        let $bar = null;

        $.on(this.$svg, 'mousedown', '.handle.progress', (e, handle) => {
            is_resizing = true;
            x_on_start = e.offsetX || e.layerX;

            const $bar_wrapper = $.closest('.bar-wrapper', handle);
            const id = $bar_wrapper.getAttribute('data-id');
            bar = this.get_bar(id);

            $bar_progress = bar.$bar_progress;
            $bar = bar.$bar;

            $bar_progress.finaldx = 0;
            $bar_progress.owidth = $bar_progress.getWidth();
            $bar_progress.min_dx = -$bar_progress.owidth;
            $bar_progress.max_dx = $bar.getWidth() - $bar_progress.getWidth();
        });

        const range_positions = this.config.ignored_positions.map((d) => [
            d,
            d + this.config.column_width,
        ]);

        $.on(this.$svg, 'mousemove', (e) => {
            if (!is_resizing) return;
            let now_x = e.offsetX || e.layerX;

            let moving_right = now_x > x_on_start;
            if (moving_right) {
                let k = range_positions.find(
                    ([begin, end]) => now_x >= begin && now_x < end,
                );
                while (k) {
                    now_x = k[1];
                    k = range_positions.find(
                        ([begin, end]) => now_x >= begin && now_x < end,
                    );
                }
            } else {
                let k = range_positions.find(
                    ([begin, end]) => now_x > begin && now_x <= end,
                );
                while (k) {
                    now_x = k[0];
                    k = range_positions.find(
                        ([begin, end]) => now_x > begin && now_x <= end,
                    );
                }
            }

            let dx = now_x - x_on_start;
            if (dx > $bar_progress.max_dx) {
                dx = $bar_progress.max_dx;
            }
            if (dx < $bar_progress.min_dx) {
                dx = $bar_progress.min_dx;
            }

            $bar_progress.setAttribute('width', $bar_progress.owidth + dx);
            $.attr(bar.$handle_progress, 'cx', $bar_progress.getEndX());

            $bar_progress.finaldx = dx;
        });

        $.on(this.$svg, 'mouseup', () => {
            is_resizing = false;
            if (!($bar_progress && $bar_progress.finaldx)) return;

            $bar_progress.finaldx = 0;
            bar.progress_changed();
            bar.set_action_completed();
            bar = null;
            $bar_progress = null;
            $bar = null;
        });
    }

    get_all_dependent_tasks(task_id) {
        let out = [];
        let to_process = [task_id];
        
        while (to_process.length > 0) {
            const deps = to_process.reduce((acc, curr) => {
                const currentDeps = this.dependency_map[curr] || [];
                return acc.concat(currentDeps);
            }, []);

            const new_deps = deps.filter((d) => d && !out.includes(d) && !to_process.includes(d));
            
            out = out.concat(new_deps);
            to_process = new_deps;
        }

        return out;
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
    _revert_downstream(bar_id, snap_by_id, visited) {
        const child_ids = this.dependency_map[bar_id] || [];
        for (const child_id of child_ids) {
            const snap = snap_by_id[child_id];
            if (!snap || !snap.pushed) continue;
            snap.pushed = false;
            snap.bar.$bar.finaldx = 0;
            snap.bar.update_bar_position({ x: snap.ox });
            visited.delete(child_id);
            this._revert_downstream(child_id, snap_by_id, visited);
        }
    }

    /**
     * Symmetric revert for backward cascade — undoes any parents we pushed
     * leftward earlier in this drag pass once the dragged bar moves back to
     * the right and no longer overlaps the parent.
     */
    _revert_upstream(bar_id, snap_by_id, visited) {
        const task = this.get_task(bar_id);
        if (!task) return;
        const parent_ids = task.dependencies || [];
        for (const parent_id of parent_ids) {
            const snap = snap_by_id[parent_id];
            if (!snap || !snap.pushed) continue;
            snap.pushed = false;
            snap.bar.$bar.finaldx = 0;
            snap.bar.update_bar_position({ x: snap.ox });
            visited.delete(parent_id);
            this._revert_upstream(parent_id, snap_by_id, visited);
        }
    }
    get_all_parent_tasks(task_id) {
        let out = [];
        let to_process = [task_id];
        
        while (to_process.length > 0) {
            const parents = to_process.reduce((acc, curr) => {
                const task = this.get_task(curr);
                // If a task lists 'curr' as a dependency, it is a parent
                return acc.concat(task ? task.dependencies : []);
            }, []);

            const new_parents = parents.filter((d) => d && !out.includes(d) && !to_process.includes(d));
            
            out = out.concat(new_parents);
            to_process = new_parents;
        }

        return out;
    }

    get_safe_x(x, drn = 1) {
        // 1. Calculate total units (days) from the start
        let units_from_start = x / this.config.column_width;
        
        // 2. Separate the "Whole Day" integer from the "Fractional Time"
        // E.g., 5.4 days -> whole_units = 5, fraction = 0.4 (preserves time of day!)
        let whole_units = Math.floor(units_from_start);
        let fraction = units_from_start - whole_units;
        
        let is_safe = false;
        let loop = 0;
        
        while (!is_safe && loop < 100) {
            // 3. Get the exact pure Date object for this whole day (00:00:00)
            let current_date = date_utils.add(
                this.gantt_start, 
                whole_units * this.config.step, 
                this.config.unit
            );
            
            // 4. Ask your React wrapper directly! No more fragile pixel math.
            let hit_weekend = this.options.is_weekend && this.options.is_weekend(current_date);
            let hit_holiday = this.options.is_holiday && this.options.is_holiday(current_date);
            
            if (hit_weekend || hit_holiday) {
                // If it's an off-day, cleanly jump exactly 1 integer day forward/backward
                whole_units += drn; 
                loop++;
            } else {
                is_safe = true; // Clean landing on a working day!
            }
        }
        
        // 5. Put the exact fractional time back and multiply by the column width
        return (whole_units + fraction) * this.config.column_width;
    }

    get_snap_position(dx, ox) {
        let unit_length = 1;
        const default_snap =
            this.options.snap_at || this.config.view_mode.snap_at || '1d';

        if (default_snap !== 'unit') {
            const { duration, scale } = date_utils.parse_duration(default_snap);
            unit_length =
                date_utils.convert_scales(this.config.view_mode.step, scale) /
                duration;
        }

        const rem = dx % (this.config.column_width / unit_length);

        let final_dx =
            dx -
            rem +
            (rem < (this.config.column_width / unit_length) * 2
                ? 0
                : this.config.column_width / unit_length);
        
        let final_pos = ox + final_dx;
        
        // Direction of drag: 1 for right, -1 for left
        const drn = final_dx >= 0 ? 1 : -1; 
        
        // Use our new flawless integer snapper!
        return this.get_safe_x(final_pos, drn) - ox;
    }

    get_ignored_region(pos) {
        // Subtract a tiny fraction so we check the pixel just INSIDE the end of the bar.
        // This prevents the progress bar from "looking ahead" into the next day's holiday!
        const check_pos = pos - 0.01;
        
        return this.config.ignored_positions.filter((val) => {
            // Inclusive of the exact start (>=), exclusive of the end (<)
            return check_pos >= val && check_pos < val + this.config.column_width;
        });
    }

    unselect_all() {
        if (this.popup) this.popup.parent.classList.add('hide');
        this.$container
            .querySelectorAll('.date-range-highlight')
            .forEach((k) => k.classList.add('hide'));
    }

    view_is(modes) {
        if (typeof modes === 'string') {
            return this.config.view_mode.name === modes;
        }

        if (Array.isArray(modes)) {
            return modes.some(view_is);
        }

        return this.config.view_mode.name === modes.name;
    }

    get_task(id) {
        return this.tasks.find((task) => {
            return task.id === id;
        });
    }

    get_bar(id) {
        return this.bars.find((bar) => {
            return bar.task.id === id;
        });
    }

    show_popup(opts) {
    if (this.options.popup === false) return;
    if (this.options.rtl) {
        const total_width = this.dates.length * this.config.column_width;
        opts.x = total_width - opts.x;
    }
    if (!this.popup) {
        this.popup = new Popup(
            this.$popup_wrapper,
            this.options.popup,
            this,
        );
    }
    this.popup.show(opts);
}

    hide_popup() {
        this.popup && this.popup.hide();
    }

    trigger_event(event, args) {
        if (this.options['on_' + event]) {
            this.options['on_' + event].apply(this, args);
        }
    }

    view_is(view) {
        return this.options.view_mode.name === view;
    }

    getDateFromClick(event) {
        const rect = this.$svg.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const columns = this.lowerTexts;
        if (!columns.length) return null;

        const index = Math.floor(x / this.config.column_width);
        const targetCell = columns[index];
        if (!targetCell) return null;

        const match = targetCell.className.match(/date_(\d{4}-\d{2}-\d{2})/);
        return match ? match[1] : null;
    }

    /**
     * Gets the oldest starting date from the list of tasks
     *
     * @returns Date
     * @memberof Gantt
     */
    get_oldest_starting_date() {
        if (!this.tasks.length) return new Date();
        return this.tasks
            .map((task) => task._start)
            .reduce((prev_date, cur_date) =>
                cur_date <= prev_date ? cur_date : prev_date,
            );
    }

    /**
     * Clear all elements from the parent svg element
     *
     * @memberof Gantt
     */
    clear() {
        this.$svg.innerHTML = '';
        this.$header?.remove?.();
        this.$side_header?.remove?.();
        this.$current_highlight?.remove?.();
        this.$extras?.remove?.();
        this.popup?.hide?.();
    }
}

Gantt.VIEW_MODE = {
    HOUR: DEFAULT_VIEW_MODES[0],
    QUARTER_DAY: DEFAULT_VIEW_MODES[1],
    HALF_DAY: DEFAULT_VIEW_MODES[2],
    DAY: DEFAULT_VIEW_MODES[3],
    WEEK: DEFAULT_VIEW_MODES[4],
    MONTH: DEFAULT_VIEW_MODES[5],
    YEAR: DEFAULT_VIEW_MODES[6],
};

function generate_id(task) {
    return task.name + '_' + Math.random().toString(36).slice(2, 12);
}

function sanitize(s) {
    return s.replaceAll(' ', '_').replaceAll(':', '_').replaceAll('.', '_');
}