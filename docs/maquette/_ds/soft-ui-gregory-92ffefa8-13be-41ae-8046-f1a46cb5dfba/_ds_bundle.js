/* @ds-bundle: {"format":4,"namespace":"SoftUIDashboardDesignSystem_92ffef","components":[{"name":"Button","sourcePath":"components/actions/Button.jsx"},{"name":"Chart","sourcePath":"components/data/Chart.jsx"},{"name":"CountUp","sourcePath":"components/data/CountUp.jsx"},{"name":"Datatable","sourcePath":"components/data/Datatable.jsx"},{"name":"Fullcalendar","sourcePath":"components/data/Fullcalendar.jsx"},{"name":"Gallery","sourcePath":"components/data/Gallery.jsx"},{"name":"Kanban","sourcePath":"components/data/Kanban.jsx"},{"name":"Three","sourcePath":"components/decorative/Three.jsx"},{"name":"Alert","sourcePath":"components/feedback/Alert.jsx"},{"name":"Badge","sourcePath":"components/feedback/Badge.jsx"},{"name":"Progress","sourcePath":"components/feedback/Progress.jsx"},{"name":"SweetAlert","sourcePath":"components/feedback/SweetAlert.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Datepicker","sourcePath":"components/forms/Datepicker.jsx"},{"name":"Dropzone","sourcePath":"components/forms/Dropzone.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"RichTextEditor","sourcePath":"components/forms/RichTextEditor.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Sliders","sourcePath":"components/forms/Sliders.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"},{"name":"Sidebar","sourcePath":"components/navigation/Sidebar.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"Wizard","sourcePath":"components/navigation/Wizard.jsx"},{"name":"Avatar","sourcePath":"components/surfaces/Avatar.jsx"},{"name":"Card","sourcePath":"components/surfaces/Card.jsx"},{"name":"Dropdown","sourcePath":"components/surfaces/Dropdown.jsx"},{"name":"Modal","sourcePath":"components/surfaces/Modal.jsx"},{"name":"Navbar","sourcePath":"components/surfaces/Navbar.jsx"},{"name":"Table","sourcePath":"components/surfaces/Table.jsx"}],"sourceHashes":{"components/actions/Button.jsx":"21e55d09020f","components/data/Chart.jsx":"377e3c6c852e","components/data/CountUp.jsx":"1b27fb711102","components/data/Datatable.jsx":"ad691d7799f5","components/data/Fullcalendar.jsx":"02e565e04755","components/data/Gallery.jsx":"cc308eac5514","components/data/Kanban.jsx":"495b0efab8b5","components/decorative/Three.jsx":"bbc111e2b9f1","components/feedback/Alert.jsx":"b42f4e634cfe","components/feedback/Badge.jsx":"6c9b083da4a0","components/feedback/Progress.jsx":"40f49c5017fe","components/feedback/SweetAlert.jsx":"a82fa8bfbb0a","components/feedback/Tooltip.jsx":"d86fbe23e051","components/forms/Checkbox.jsx":"9a38090d7aa6","components/forms/Datepicker.jsx":"e7e5ff081e51","components/forms/Dropzone.jsx":"d85fff8566e3","components/forms/Input.jsx":"3b8c04ed2a1e","components/forms/RichTextEditor.jsx":"58bacd73958c","components/forms/Select.jsx":"4d638cc09ea2","components/forms/Sliders.jsx":"39fedfdaf93f","components/forms/Switch.jsx":"817cfe67c0f9","components/forms/Textarea.jsx":"e37d9e85c225","components/navigation/Sidebar.jsx":"bc377f89feeb","components/navigation/Tabs.jsx":"4f4a00b9f7c2","components/navigation/Wizard.jsx":"fb704ca2e3e8","components/surfaces/Avatar.jsx":"b57fe5618219","components/surfaces/Card.jsx":"11d975a7ae7b","components/surfaces/Dropdown.jsx":"3afb312ed664","components/surfaces/Modal.jsx":"bb9bfaa41fe1","components/surfaces/Navbar.jsx":"841cbe039edb","components/surfaces/Table.jsx":"d30ace9de015","ui_kits/apps/Common.jsx":"d006286a99e7","ui_kits/apps/Screens1.jsx":"1b0e12868c29","ui_kits/apps/Screens2.jsx":"a38aa7a95f38"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.SoftUIDashboardDesignSystem_92ffef = window.SoftUIDashboardDesignSystem_92ffef || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/actions/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Button({
  variant = 'gradient',
  color = 'primary',
  size = 'md',
  icon,
  disabled,
  children,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);
  const grad = `var(--gradient-${color})`,
    solid = `var(--solid-${color})`;
  const pad = icon && !children ? '12px' : size === 'lg' ? '12px 32px' : size === 'sm' ? '8px 16px' : '12px 24px';
  const v = {
    gradient: {
      background: grad,
      color: '#fff',
      border: '1px solid transparent',
      boxShadow: hover ? 'var(--shadow-xs)' : 'var(--shadow-md)'
    },
    flat: {
      background: solid,
      color: '#fff',
      border: '1px solid transparent',
      boxShadow: hover ? 'var(--shadow-xs)' : 'var(--shadow-md)'
    },
    outline: {
      background: active ? solid : 'transparent',
      color: active ? '#fff' : solid,
      border: `1px solid ${solid}`,
      boxShadow: 'none'
    },
    ghost: {
      background: `color-mix(in srgb, ${solid} ${active ? 45 : hover ? 25 : 0}%, transparent)`,
      color: solid,
      border: '1px solid transparent',
      boxShadow: 'none'
    }
  }[variant];
  return /*#__PURE__*/React.createElement("button", _extends({
    disabled: disabled
  }, rest, {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setActive(false);
    },
    onMouseDown: () => setActive(true),
    onMouseUp: () => setActive(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      fontFamily: 'var(--font-sans)',
      fontSize: 12,
      lineHeight: '15px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '-.025rem',
      padding: pad,
      borderRadius: 'var(--radius-md)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? .65 : variant === 'gradient' || variant === 'flat' ? active ? .85 : 1 : 1,
      transform: hover && !disabled && (variant === 'gradient' || variant === 'flat') ? 'scale(1.02)' : 'none',
      transition: 'all .15s var(--ease-soft)',
      ...v,
      ...style
    }
  }), icon, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/Button.jsx", error: String((e && e.message) || e) }); }

// components/data/Chart.jsx
try { (() => {
function Chart({
  title,
  caption,
  labels = [],
  series = [],
  variant = 'line',
  stats = [],
  height = 200
}) {
  const W = 600,
    H = height,
    P = 16;
  const pal = ['var(--fuchsia-500)', 'var(--cyan-500)', 'var(--lime-500)', 'var(--amber-400)', 'var(--red-500)', 'var(--slate-500)'];
  const all = series.flatMap(s => s.data),
    max = Math.max(...all, 1),
    min = Math.min(...all, 0);
  const x = i => P + (labels.length > 1 ? i * (W - 2 * P) / (labels.length - 1) : 0);
  const y = v => H - P - (v - min) / (max - min || 1) * (H - 2 * P);
  const dark = variant === 'dark';
  const gid = React.useId().replace(/:/g, '');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-card)',
      padding: 16,
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 8px 12px'
    }
  }, /*#__PURE__*/React.createElement("h6", {
    style: {
      margin: 0,
      fontSize: 16,
      lineHeight: '26px',
      fontWeight: 600,
      color: 'var(--text-heading)'
    }
  }, title), caption && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--text-body)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-arrow-up",
    style: {
      color: 'var(--lime-500)',
      fontSize: 12
    }
  }), " ", caption)), /*#__PURE__*/React.createElement("div", {
    style: {
      background: dark ? 'var(--gradient-dark)' : 'transparent',
      borderRadius: 'var(--radius-lg)',
      padding: dark ? 16 : 0
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${W} ${H}`,
    style: {
      width: '100%',
      display: 'block'
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: gid,
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0",
    stopColor: "#ff0080",
    stopOpacity: ".35"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "1",
    stopColor: "#7928ca",
    stopOpacity: "0"
  }))), series.map((s, k) => {
    const col = series.length === 1 && !dark ? 'var(--fuchsia-500)' : dark ? '#fff' : pal[k % 6];
    if (variant === 'bar') {
      const bw = (W - 2 * P) / labels.length / (series.length + 1);
      return s.data.map((v, i) => /*#__PURE__*/React.createElement("rect", {
        key: k + '-' + i,
        x: P + i * (W - 2 * P) / labels.length + k * bw + bw / 2,
        y: y(v),
        width: bw,
        height: H - P - y(v),
        rx: "4",
        fill: pal[k % 6]
      }));
    }
    const d = s.data.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ');
    return /*#__PURE__*/React.createElement("g", {
      key: k
    }, series.length === 1 && !dark && /*#__PURE__*/React.createElement("path", {
      d: `${d} L${x(s.data.length - 1)},${H - P} L${x(0)},${H - P} Z`,
      fill: `url(#${gid})`
    }), /*#__PURE__*/React.createElement("path", {
      d: d,
      fill: "none",
      stroke: col,
      strokeWidth: "3",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '4px 8px 0',
      fontSize: 12,
      color: dark ? 'rgba(255,255,255,.8)' : 'var(--text-muted)'
    }
  }, labels.map(l => /*#__PURE__*/React.createElement("span", {
    key: l
  }, l)))), stats.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: `repeat(${stats.length},1fr)`,
      gap: 16,
      padding: '16px 8px 4px'
    }
  }, stats.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.label
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 20,
      height: 20,
      borderRadius: 6,
      background: `var(--gradient-${s.color})`,
      boxShadow: 'var(--shadow-2xl)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      lineHeight: '16px',
      color: 'var(--text-body)'
    }
  }, s.label)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      color: 'var(--text-heading)',
      marginTop: 4
    }
  }, s.value)))));
}
Object.assign(__ds_scope, { Chart });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Chart.jsx", error: String((e && e.message) || e) }); }

// components/data/CountUp.jsx
try { (() => {
function CountUp({
  value = 0,
  duration = 1200,
  prefix = '',
  suffix = '',
  decimals = 0,
  color = 'var(--text-heading)',
  style
}) {
  const [n, setN] = React.useState(0);
  const from = React.useRef(0);
  React.useEffect(() => {
    const start = performance.now(),
      a = from.current;
    let raf;
    const tick = t => {
      const p = Math.min(1, (t - start) / duration),
        e = 1 - Math.pow(1 - p, 3);
      const v = a + (value - a) * e;
      setN(v);
      from.current = v;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 20,
      lineHeight: '27.5px',
      fontWeight: 700,
      color,
      ...style
    }
  }, prefix, n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }), suffix);
}
Object.assign(__ds_scope, { CountUp });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/CountUp.jsx", error: String((e && e.message) || e) }); }

// components/data/Datatable.jsx
try { (() => {
function Datatable({
  title,
  columns = [],
  rows = [],
  perPageOptions = [5, 10, 25]
}) {
  const [per, setPer] = React.useState(perPageOptions[0]);
  const [page, setPage] = React.useState(0);
  const [q, setQ] = React.useState('');
  const f = rows.filter(r => r.join(' ').toLowerCase().includes(q.toLowerCase()));
  const pages = Math.max(1, Math.ceil(f.length / per));
  const cur = Math.min(page, pages - 1),
    vis = f.slice(cur * per, cur * per + per);
  const th = {
    textAlign: 'left',
    padding: '8px 24px',
    fontSize: 10.4,
    fontWeight: 700,
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    opacity: .7,
    borderBottom: '1px solid var(--surface-border)'
  };
  const td = {
    padding: '12px 24px',
    fontSize: 14,
    lineHeight: '24px',
    color: 'var(--text-body)',
    borderBottom: '1px solid var(--surface-border)'
  };
  const pg = on => ({
    minWidth: 28,
    height: 28,
    padding: '0 6px',
    border: 0,
    borderRadius: 'var(--radius-circle)',
    background: on ? 'var(--fuchsia-500)' : 'transparent',
    color: on ? '#fff' : 'var(--text-muted)',
    fontFamily: 'inherit',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer'
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-card)',
      fontFamily: 'var(--font-sans)',
      overflow: 'hidden'
    }
  }, title && /*#__PURE__*/React.createElement("h6", {
    style: {
      margin: 0,
      padding: '24px 24px 0',
      fontSize: 16,
      lineHeight: '26px',
      fontWeight: 600,
      color: 'var(--text-heading)'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 24px',
      fontSize: 12,
      color: 'var(--text-body)'
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("select", {
    value: per,
    onChange: e => {
      setPer(+e.target.value);
      setPage(0);
    },
    style: {
      fontFamily: 'inherit',
      fontSize: 12,
      border: '1px solid var(--gray-200)',
      borderRadius: 'var(--radius-sm)',
      padding: '4px 8px',
      background: '#fff',
      color: 'var(--text-body)'
    }
  }, perPageOptions.map(o => /*#__PURE__*/React.createElement("option", {
    key: o
  }, o))), "entries per page"), /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => {
      setQ(e.target.value);
      setPage(0);
    },
    placeholder: "Search...",
    style: {
      fontFamily: 'inherit',
      fontSize: 14,
      border: '1px solid var(--surface-border-input)',
      borderRadius: 'var(--radius-md)',
      padding: '6px 12px',
      outline: 0,
      color: 'var(--text-body)'
    }
  })), /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse'
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, columns.map(c => /*#__PURE__*/React.createElement("th", {
    key: c,
    style: th
  }, c)))), /*#__PURE__*/React.createElement("tbody", null, vis.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: i
  }, r.map((c, j) => /*#__PURE__*/React.createElement("td", {
    key: j,
    style: td
  }, c)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 24px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      lineHeight: '16px',
      color: 'var(--text-muted)'
    }
  }, "Showing ", f.length ? cur * per + 1 : 0, " to ", Math.min(f.length, cur * per + per), " of ", f.length, " entries"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: pg(false),
    onClick: () => setPage(Math.max(0, cur - 1))
  }, "\u2039"), Array.from({
    length: pages
  }, (_, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    style: pg(i === cur),
    onClick: () => setPage(i)
  }, i + 1)), /*#__PURE__*/React.createElement("button", {
    style: pg(false),
    onClick: () => setPage(Math.min(pages - 1, cur + 1))
  }, "\u203A"))));
}
Object.assign(__ds_scope, { Datatable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Datatable.jsx", error: String((e && e.message) || e) }); }

// components/data/Fullcalendar.jsx
try { (() => {
function Fullcalendar({
  year = 2020,
  month = 11,
  events = []
}) {
  const first = new Date(year, month, 1),
    days = new Date(year, month + 1, 0).getDate(),
    pad = first.getDay();
  const cells = Array.from({
    length: Math.ceil((pad + days) / 7) * 7
  }, (_, i) => i - pad + 1);
  const title = first.toLocaleString('en-US', {
    month: 'long',
    year: 'numeric'
  });
  const nav = {
    background: 'var(--slate-400)',
    color: '#fff',
    border: 0,
    borderRadius: 3.5,
    padding: '6px 12px',
    fontFamily: 'inherit',
    fontSize: 14,
    cursor: 'pointer'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-card)',
      padding: 24,
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: nav
  }, "\u2039"), /*#__PURE__*/React.createElement("button", {
    style: nav
  }, "\u203A"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...nav,
      marginLeft: 4
    }
  }, "today")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      color: 'var(--text-heading)'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 120
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7,1fr)',
      border: '1px solid var(--gray-200)',
      borderRight: 0,
      borderBottom: 0
    }
  }, ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => /*#__PURE__*/React.createElement("div", {
    key: d,
    style: {
      padding: '8px 4px',
      textAlign: 'center',
      fontSize: 16,
      fontWeight: 700,
      color: 'var(--text-body)',
      borderRight: '1px solid var(--gray-200)',
      borderBottom: '1px solid var(--gray-200)'
    }
  }, d)), cells.map((d, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      minHeight: 84,
      padding: 4,
      borderRight: '1px solid var(--gray-200)',
      borderBottom: '1px solid var(--gray-200)'
    }
  }, d > 0 && d <= days && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right',
      fontSize: 14,
      fontWeight: 600,
      color: '#495057',
      padding: '0 4px 4px'
    }
  }, d), events.filter(e => e.day === d).map(e => /*#__PURE__*/React.createElement("div", {
    key: e.title,
    style: {
      background: `var(--gradient-${e.color})`,
      color: '#fff',
      fontSize: 13.6,
      borderRadius: 5.6,
      padding: '1px 4px',
      marginBottom: 2,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, e.title)))))));
}
Object.assign(__ds_scope, { Fullcalendar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Fullcalendar.jsx", error: String((e && e.message) || e) }); }

// components/data/Gallery.jsx
try { (() => {
function Gallery({
  images = [],
  fullscreen = false,
  onClose
}) {
  const [i, setI] = React.useState(0);
  const ph = (src, w, h, extra) => src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: "",
    style: {
      width: w,
      height: h,
      objectFit: 'cover',
      display: 'block',
      ...extra
    }
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      width: w,
      height: h,
      background: 'var(--slate-200)',
      ...extra
    }
  });
  if (fullscreen) return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setI((i + images.length - 1) % images.length),
    style: {
      position: 'absolute',
      left: 16,
      background: 'transparent',
      border: 0,
      color: '#fff',
      fontSize: 32,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-chevron-left"
  })), ph(images[i], 'min(80vw,900px)', '70vh', {
    borderRadius: 'var(--radius-lg)'
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setI((i + 1) % images.length),
    style: {
      position: 'absolute',
      right: 16,
      background: 'transparent',
      border: 0,
      color: '#fff',
      fontSize: 32,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-chevron-right"
  })), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      position: 'absolute',
      top: 16,
      right: 24,
      background: 'transparent',
      border: 0,
      color: '#fff',
      fontSize: 28,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-xmark"
  })));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-block',
      fontFamily: 'var(--font-sans)'
    }
  }, ph(images[i], 420, 300, {
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-3xl)'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 16
    }
  }, images.map((s, k) => /*#__PURE__*/React.createElement("div", {
    key: k,
    onClick: () => setI(k),
    style: {
      cursor: 'pointer',
      borderRadius: 'var(--radius-lg)',
      boxShadow: k === i ? '0 0 0 2px var(--fuchsia-300), var(--shadow-2xl)' : 'var(--shadow-2xl)'
    }
  }, ph(s, 90, 100, {
    borderRadius: 'var(--radius-lg)'
  })))));
}
Object.assign(__ds_scope, { Gallery });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Gallery.jsx", error: String((e && e.message) || e) }); }

// components/data/Kanban.jsx
try { (() => {
function KCard({
  card
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-md)',
      padding: 15,
      marginBottom: 20,
      fontSize: 14,
      lineHeight: '24px',
      color: 'var(--text-body)'
    }
  }, card.cover && /*#__PURE__*/React.createElement("img", {
    src: card.cover,
    alt: "",
    style: {
      width: '100%',
      borderRadius: 'var(--radius-sm)',
      display: 'block',
      marginBottom: 12
    }
  }), card.status && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block',
      background: `var(--gradient-${card.color || 'primary'})`,
      color: '#fff',
      fontSize: 10.4,
      fontWeight: 700,
      textTransform: 'uppercase',
      padding: '7.2px 12px',
      borderRadius: 'var(--radius-chip)',
      marginBottom: 8
    }
  }, card.status), /*#__PURE__*/React.createElement("div", {
    style: {
      color: card.status ? 'var(--text-heading)' : 'var(--text-body)',
      fontWeight: card.status ? 600 : 400
    }
  }, card.title), card.assignees > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      marginTop: 8,
      paddingLeft: 8
    }
  }, Array.from({
    length: card.assignees
  }, (_, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: 24,
      height: 24,
      boxSizing: 'border-box',
      borderRadius: '50%',
      border: '2px solid #fff',
      marginLeft: -8,
      background: 'var(--slate-300)'
    }
  }))));
}
function Kanban({
  columns = []
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 20,
      overflowX: 'auto',
      fontFamily: 'var(--font-sans)'
    }
  }, columns.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.title,
    style: {
      flex: '0 0 300px',
      background: 'var(--gray-200)',
      borderRadius: 'var(--radius-lg)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 600,
      color: 'var(--text-heading)'
    }
  }, c.title), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-body)'
    }
  }, "+")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 20px'
    }
  }, c.cards.map((k, i) => /*#__PURE__*/React.createElement(KCard, {
    key: i,
    card: k
  }))))));
}
Object.assign(__ds_scope, { Kanban });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Kanban.jsx", error: String((e && e.message) || e) }); }

// components/decorative/Three.jsx
try { (() => {
function Three({
  size = 360,
  color = '#989db5',
  points = 1400,
  style
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const T = window.THREE;
    const el = ref.current;
    if (!T || !el) return;
    let renderer;
    try {
      renderer = new T.WebGLRenderer({
        antialias: true,
        alpha: true
      });
    } catch (e) {
      return;
    }
    renderer.setSize(size, size);
    el.appendChild(renderer.domElement);
    const scene = new T.Scene(),
      cam = new T.PerspectiveCamera(45, 1, 1, 2000);
    cam.position.set(0, 0, -265);
    cam.lookAt(0, 0, 0);
    const geo = new T.SphereGeometry(.9, 1, 1),
      mat = new T.MeshBasicMaterial({
        color
      }),
      mesh = new T.InstancedMesh(geo, mat, points),
      m = new T.Object3D();
    for (let i = 0; i < points; i++) {
      const p = Math.acos(1 - 2 * (i + .5) / points),
        t = Math.PI * (1 + Math.sqrt(5)) * i;
      m.position.set(100 * Math.sin(p) * Math.cos(t), 100 * Math.cos(p), 100 * Math.sin(p) * Math.sin(t));
      m.lookAt(0, 0, 0);
      m.updateMatrix();
      mesh.setMatrixAt(i, m.matrix);
    }
    scene.add(mesh);
    let raf;
    const loop = () => {
      mesh.rotation.y += .004;
      renderer.render(scene, cam);
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      cancelAnimationFrame(raf);
      renderer.dispose();
      el.innerHTML = '';
    };
  }, [size, color, points]);
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    style: {
      width: size,
      height: size,
      ...style
    }
  });
}
Object.assign(__ds_scope, { Three });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/decorative/Three.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Alert.jsx
try { (() => {
function Alert({
  variant = 'gradient',
  color = 'primary',
  dismissible,
  onDismiss,
  children,
  style
}) {
  const solid = color === 'warning' ? 'var(--yellow-400)' : `var(--solid-${color})`;
  const v = variant === 'gradient' ? {
    background: `var(--gradient-${color})`,
    border: '1px solid rgba(255,255,255,.35)'
  } : {
    background: solid,
    border: '1px solid transparent'
  };
  return /*#__PURE__*/React.createElement("div", {
    role: "alert",
    style: {
      position: 'relative',
      padding: dismissible ? '16px 48px 16px 16px' : 16,
      borderRadius: 'var(--radius-md)',
      color: '#fff',
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      lineHeight: '24px',
      ...v,
      ...style
    }
  }, children, dismissible && /*#__PURE__*/React.createElement("button", {
    onClick: onDismiss,
    "aria-label": "Dismiss",
    style: {
      position: 'absolute',
      top: 0,
      right: 0,
      padding: 16,
      background: 'transparent',
      border: 0,
      color: '#fff',
      fontSize: 14,
      lineHeight: 1,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-xmark"
  })));
}
Object.assign(__ds_scope, { Alert });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Alert.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Badge.jsx
try { (() => {
function Badge({
  variant = 'soft',
  color = 'primary',
  children,
  style
}) {
  const v = variant === 'gradient' ? {
    background: `var(--gradient-${color})`,
    color: '#fff'
  } : variant === 'neutral' ? {
    background: 'linear-gradient(to bottom right, var(--gray-400), var(--gray-100))',
    color: 'var(--slate-500)'
  } : {
    background: `var(--soft-${color}-bg)`,
    color: `var(--soft-${color}-fg)`
  };
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block',
      fontFamily: 'var(--font-sans)',
      fontSize: 12,
      fontWeight: 700,
      lineHeight: 1,
      textTransform: 'uppercase',
      padding: '8.8px 14.4px',
      borderRadius: 'var(--radius-chip)',
      ...v,
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Badge.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Progress.jsx
try { (() => {
function Progress({
  label,
  value = 0,
  color = 'primary',
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 8,
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--text-heading)'
    }
  }, /*#__PURE__*/React.createElement("span", null, label), /*#__PURE__*/React.createElement("span", null, value, "%")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 12,
      background: 'var(--gray-200)',
      borderRadius: 'var(--radius-pill)',
      display: 'flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${value}%`,
      height: 6,
      background: `var(--solid-${color})`,
      borderRadius: 'var(--radius-sm)',
      transition: 'width .6s var(--ease-soft)'
    }
  })));
}
Object.assign(__ds_scope, { Progress });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Progress.jsx", error: String((e && e.message) || e) }); }

// components/feedback/SweetAlert.jsx
try { (() => {
const swalIcons = {
  success: ['var(--lime-500)', 'fa-check'],
  warning: ['#f8bb86', 'fa-exclamation'],
  error: ['#f27474', 'fa-xmark'],
  info: ['#3fc3ee', 'fa-info']
};
function SweetAlert({
  icon = 'success',
  title,
  text,
  confirmText = 'OK',
  cancelText,
  confirmColor = 'info',
  cancelColor = 'danger',
  onConfirm,
  onCancel,
  inline = false
}) {
  const [c, g] = swalIcons[icon] || swalIcons.info;
  const btn = col => ({
    padding: '12px 24px',
    border: 0,
    borderRadius: 'var(--radius-md)',
    background: `var(--gradient-${col})`,
    color: '#fff',
    fontFamily: 'var(--font-sans)',
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    boxShadow: 'var(--shadow-xs)',
    cursor: 'pointer'
  });
  const box = /*#__PURE__*/React.createElement("div", {
    role: "alertdialog",
    style: {
      width: 512,
      maxWidth: '100%',
      boxSizing: 'border-box',
      padding: '32px 24px 24px',
      background: '#fff',
      borderRadius: 'var(--radius-xl)',
      textAlign: 'center',
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 80,
      height: 80,
      margin: '0 auto 16px',
      boxSizing: 'border-box',
      border: `4px solid ${c}`,
      borderRadius: '50%',
      color: c,
      fontSize: 36,
      lineHeight: '72px',
      opacity: .9
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: 'fa-solid ' + g
  })), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: '0 0 8px',
      fontSize: 30,
      lineHeight: '41.25px',
      fontWeight: 600,
      color: 'var(--text-heading)'
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 24px',
      fontSize: 16,
      lineHeight: '25.6px',
      color: 'var(--text-body)'
    }
  }, text), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: btn(confirmColor),
    onClick: onConfirm
  }, confirmText), cancelText && /*#__PURE__*/React.createElement("button", {
    style: btn(cancelColor),
    onClick: onCancel
  }, cancelText)));
  return inline ? box : /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      zIndex: 100
    }
  }, box);
}
Object.assign(__ds_scope, { SweetAlert });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/SweetAlert.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
function Tooltip({
  text,
  placement = 'top',
  children,
  show
}) {
  const [hover, setHover] = React.useState(false);
  const open = show ?? hover;
  const pos = {
    top: {
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginBottom: 6
    },
    bottom: {
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginTop: 6
    },
    left: {
      right: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginRight: 6
    },
    right: {
      left: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginLeft: 6
    }
  }[placement];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-block'
    },
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false)
  }, children, open && /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    style: {
      position: 'absolute',
      zIndex: 10,
      width: 'max-content',
      maxWidth: 184,
      background: '#000',
      color: '#fff',
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      lineHeight: '20px',
      textAlign: 'center',
      padding: '4px 8px',
      borderRadius: 'var(--radius-md)',
      ...pos
    }
  }, text));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function Checkbox({
  checked = false,
  onChange,
  label,
  disabled
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      color: 'var(--text-body)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? .6 : 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    onClick: () => !disabled && onChange && onChange(!checked),
    role: "checkbox",
    "aria-checked": checked,
    style: {
      width: 20,
      height: 20,
      boxSizing: 'border-box',
      borderRadius: 'var(--radius-checkbox)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: checked ? 'var(--gradient-dark)' : '#fff',
      border: checked ? '1px solid transparent' : '1px solid var(--gray-300)'
    }
  }, checked && /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-check",
    style: {
      color: '#fff',
      fontSize: 10
    }
  })), label);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Datepicker.jsx
try { (() => {
function Datepicker({
  value,
  onChange,
  placeholder = 'Select date',
  open: openProp
}) {
  const [open, setOpen] = React.useState(!!openProp);
  const [sel, setSel] = React.useState(value || null);
  const [view, setView] = React.useState(() => {
    const d = value ? new Date(value) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const y = view.getFullYear(),
    m = view.getMonth(),
    days = new Date(y, m + 1, 0).getDate(),
    pad = view.getDay();
  const iso = d => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const arrow = {
    background: 'transparent',
    border: 0,
    cursor: 'pointer',
    fontSize: 16,
    color: 'var(--text-body)',
    padding: '0 8px'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'inline-block',
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("input", {
    readOnly: true,
    value: sel || '',
    placeholder: placeholder,
    onClick: () => setOpen(!open),
    style: {
      width: 240,
      boxSizing: 'border-box',
      border: `1px solid ${open ? 'var(--fuchsia-300)' : 'var(--surface-border-input)'}`,
      boxShadow: open ? 'var(--shadow-focus-primary)' : 'none',
      outline: 0,
      borderRadius: 'var(--radius-md)',
      padding: '8px 12px',
      fontFamily: 'inherit',
      fontSize: 14,
      lineHeight: '24px',
      color: 'var(--text-body)',
      background: '#fff'
    }
  }), open && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: '100%',
      left: 0,
      marginTop: 4,
      width: 280,
      boxSizing: 'border-box',
      padding: 12,
      background: '#fff',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-3xl)',
      zIndex: 5
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: arrow,
    onClick: () => setView(new Date(y, m - 1, 1))
  }, "\u2039"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--text-heading)'
    }
  }, view.toLocaleString('en-US', {
    month: 'long',
    year: 'numeric'
  })), /*#__PURE__*/React.createElement("button", {
    style: arrow,
    onClick: () => setView(new Date(y, m + 1, 1))
  }, "\u203A")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7,1fr)',
      textAlign: 'center',
      fontSize: 12,
      rowGap: 2
    }
  }, ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      color: 'var(--text-muted)',
      fontWeight: 700,
      lineHeight: '24px'
    }
  }, d)), Array.from({
    length: pad
  }, (_, i) => /*#__PURE__*/React.createElement("div", {
    key: 'p' + i
  })), Array.from({
    length: days
  }, (_, i) => {
    const on = sel === iso(i + 1);
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      onClick: () => {
        setSel(iso(i + 1));
        setOpen(false);
        onChange && onChange(iso(i + 1));
      },
      style: {
        lineHeight: '32px',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        background: on ? 'var(--fuchsia-500)' : 'transparent',
        color: on ? '#fff' : 'var(--text-body)',
        fontSize: 14
      }
    }, i + 1);
  }))));
}
Object.assign(__ds_scope, { Datepicker });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Datepicker.jsx", error: String((e && e.message) || e) }); }

// components/forms/Dropzone.jsx
try { (() => {
function Dropzone({
  label = 'Drop files here to upload',
  onFiles,
  dragging: dragProp
}) {
  const [drag, setDrag] = React.useState(false);
  const [files, setFiles] = React.useState([]);
  const on = dragProp ?? drag;
  const take = fl => {
    const a = Array.from(fl).map(f => f.name);
    setFiles(a);
    onFiles && onFiles(fl);
  };
  return /*#__PURE__*/React.createElement("div", {
    onDragOver: e => {
      e.preventDefault();
      setDrag(true);
    },
    onDragLeave: () => setDrag(false),
    onDrop: e => {
      e.preventDefault();
      setDrag(false);
      take(e.dataTransfer.files);
    },
    style: {
      boxSizing: 'border-box',
      padding: 20,
      minHeight: 120,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      background: '#fff',
      border: `1px solid ${on ? 'var(--fuchsia-300)' : 'var(--surface-border-input)'}`,
      boxShadow: on ? 'var(--shadow-focus-primary)' : 'none',
      borderRadius: 'var(--radius-md)',
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      fontWeight: 400,
      color: 'var(--text-muted)',
      transition: 'all .15s'
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      cursor: 'pointer'
    }
  }, label, /*#__PURE__*/React.createElement("input", {
    type: "file",
    multiple: true,
    hidden: true,
    onChange: e => take(e.target.files)
  })), files.map(f => /*#__PURE__*/React.createElement("span", {
    key: f,
    style: {
      fontSize: 12,
      color: 'var(--text-body)'
    }
  }, f)));
}
Object.assign(__ds_scope, { Dropzone });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Dropzone.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Input({
  size = 'md',
  icon,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const py = {
    sm: 4,
    md: 8,
    lg: 12
  }[size];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      background: '#fff',
      border: `1px solid ${focus ? 'var(--fuchsia-300)' : 'var(--surface-border-input)'}`,
      borderRadius: 'var(--radius-md)',
      boxShadow: focus ? 'var(--shadow-focus-primary)' : 'none',
      transition: 'box-shadow .15s, border-color .15s',
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      padding: '0 0 0 12px',
      color: 'var(--slate-500)',
      display: 'flex'
    }
  }, icon), /*#__PURE__*/React.createElement("input", _extends({}, rest, {
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: 0,
      outline: 0,
      background: 'transparent',
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      lineHeight: '24px',
      color: 'var(--text-body)',
      padding: `${py}px 12px`
    }
  })));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/RichTextEditor.jsx
try { (() => {
function RichTextEditor({
  html = '',
  minHeight = 140
}) {
  const ref = React.useRef(null);
  const [act, setAct] = React.useState({});
  const cmd = (c, v) => {
    ref.current && ref.current.focus();
    document.execCommand(c, false, v);
    setAct({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline')
    });
  };
  const btn = (c, label, st, key) => /*#__PURE__*/React.createElement("button", {
    key: c + label,
    onMouseDown: e => {
      e.preventDefault();
      cmd(c, st);
    },
    style: {
      minWidth: 28,
      height: 28,
      border: 0,
      borderRadius: 'var(--radius-sm)',
      background: 'transparent',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      color: act[key || c] ? 'var(--fuchsia-500)' : 'var(--slate-500)',
      fontWeight: c === 'bold' ? 700 : 400,
      fontStyle: c === 'italic' ? 'italic' : 'normal',
      textDecoration: c === 'underline' ? 'underline' : 'none'
    }
  }, label);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--surface-border-input)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      background: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      padding: 8,
      borderBottom: '1px solid var(--surface-border-input)'
    }
  }, btn('bold', 'B'), btn('italic', 'I'), btn('underline', 'U'), btn('insertUnorderedList', '• List', undefined, 'ul'), btn('insertOrderedList', '1. List', undefined, 'ol')), /*#__PURE__*/React.createElement("div", {
    ref: ref,
    contentEditable: true,
    suppressContentEditableWarning: true,
    dangerouslySetInnerHTML: {
      __html: html
    },
    style: {
      minHeight,
      padding: '8px 12px',
      outline: 0,
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      lineHeight: '24px',
      color: 'var(--text-body)'
    }
  }));
}
Object.assign(__ds_scope, { RichTextEditor });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/RichTextEditor.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function Select({
  options = [],
  value,
  onChange,
  multiple = false,
  placeholder = 'Select...',
  open: openProp
}) {
  const [open, setOpen] = React.useState(!!openProp);
  const [v, setV] = React.useState(value ?? (multiple ? [] : null));
  const set = n => {
    setV(n);
    onChange && onChange(n);
  };
  const pick = o => {
    if (multiple) set(v.includes(o) ? v.filter(x => x !== o) : [...v, o]);else {
      set(o);
      setOpen(false);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: 280,
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: () => setOpen(!open),
    style: {
      boxSizing: 'border-box',
      minHeight: 42,
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 4,
      padding: '8px 12px',
      background: '#fff',
      border: `1px solid ${open ? 'var(--fuchsia-300)' : 'var(--surface-border-input)'}`,
      boxShadow: open ? 'var(--shadow-focus-primary)' : 'none',
      borderRadius: 'var(--radius-md)',
      fontSize: 14,
      lineHeight: '24px',
      color: 'var(--text-body)',
      cursor: 'pointer'
    }
  }, multiple ? v.length ? v.map(t => /*#__PURE__*/React.createElement("span", {
    key: t,
    style: {
      background: 'var(--slate-800)',
      color: '#fff',
      fontSize: 12,
      borderRadius: 20,
      padding: '4px 5px 4px 10px',
      display: 'inline-flex',
      gap: 6,
      alignItems: 'center'
    }
  }, t, /*#__PURE__*/React.createElement("span", {
    onClick: e => {
      e.stopPropagation();
      pick(t);
    },
    style: {
      cursor: 'pointer',
      fontSize: 10
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-xmark"
  })))) : /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--gray-500)'
    }
  }, placeholder) : v || /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--gray-500)'
    }
  }, placeholder)), open && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      marginTop: 4,
      background: '#fff',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-3xl)',
      padding: '8px 0',
      zIndex: 5
    }
  }, options.map(o => {
    const on = multiple ? v.includes(o) : v === o;
    return /*#__PURE__*/React.createElement("div", {
      key: o,
      onClick: () => pick(o),
      style: {
        padding: '5px 16px',
        fontSize: 14,
        lineHeight: '24px',
        cursor: 'pointer',
        color: on ? 'var(--text-heading)' : 'var(--text-body)',
        fontWeight: on ? 600 : 400
      }
    }, o);
  })));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Sliders.jsx
try { (() => {
function Sliders({
  value = 21,
  min = 16,
  max = 38,
  unit = '°C',
  size = 200,
  onChange
}) {
  const [v, setV] = React.useState(value);
  const ref = React.useRef(null);
  const cx = 100,
    cy = 100,
    r = 85,
    a0 = 135,
    span = 270;
  const pt = a => [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)];
  const arc = (a, b) => {
    const [x1, y1] = pt(a),
      [x2, y2] = pt(b);
    return `M${x1},${y1} A${r},${r} 0 ${b - a > 180 ? 1 : 0} 1 ${x2},${y2}`;
  };
  const frac = (v - min) / (max - min),
    end = a0 + span * frac,
    [hx, hy] = pt(end);
  const move = e => {
    const b = ref.current.getBoundingClientRect(),
      x = e.clientX - (b.left + b.width / 2),
      y = e.clientY - (b.top + b.height * 100 / 200);
    let a = Math.atan2(y, x) * 180 / Math.PI - a0;
    if (a < 0) a += 360;
    if (a > span) a = a - span < (360 - span) / 2 ? span : 0;
    const nv = Math.round(min + a / span * (max - min));
    setV(nv);
    onChange && onChange(nv);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      fontFamily: 'var(--font-sans)',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    ref: ref,
    viewBox: "0 0 200 200",
    style: {
      width: '100%',
      display: 'block',
      touchAction: 'none',
      cursor: 'pointer'
    },
    onPointerDown: e => {
      e.currentTarget.setPointerCapture(e.pointerId);
      move(e);
    },
    onPointerMove: e => e.buttons && move(e)
  }, /*#__PURE__*/React.createElement("path", {
    d: arc(a0, a0 + span),
    fill: "none",
    stroke: "#d3d3d3",
    strokeWidth: "5",
    strokeLinecap: "round"
  }), frac > 0 && /*#__PURE__*/React.createElement("path", {
    d: arc(a0, end),
    fill: "none",
    stroke: "var(--fuchsia-500)",
    strokeWidth: "5",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: hx,
    cy: hy,
    r: "7",
    fill: "var(--fuchsia-500)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
      paddingBottom: '6%'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 28,
      fontWeight: 700,
      color: 'var(--text-heading)'
    }
  }, v), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--text-muted)',
      marginLeft: 2,
      alignSelf: 'center'
    }
  }, unit)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '0 14%',
      marginTop: -28,
      fontSize: 12,
      lineHeight: '16px',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", null, min, unit), /*#__PURE__*/React.createElement("span", null, max, unit)));
}
Object.assign(__ds_scope, { Sliders });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Sliders.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function Switch({
  checked = false,
  onChange,
  label,
  disabled
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      color: 'var(--text-body)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? .6 : 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    onClick: () => !disabled && onChange && onChange(!checked),
    role: "switch",
    "aria-checked": checked,
    style: {
      position: 'relative',
      width: 40,
      height: 20,
      boxSizing: 'border-box',
      borderRadius: 'var(--radius-pill)',
      border: '1px solid var(--gray-200)',
      background: checked ? 'rgba(58,65,111,.95)' : '#fff',
      transition: 'all .3s var(--ease-soft)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 1,
      left: 1,
      width: 16,
      height: 16,
      borderRadius: '50%',
      background: '#fff',
      boxShadow: 'var(--shadow-2xl)',
      transform: checked ? 'translateX(20px)' : 'none',
      transition: 'transform .3s var(--ease-soft)'
    }
  })), label);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Textarea({
  rows = 5,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("textarea", _extends({
    rows: rows
  }, rest, {
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      display: 'block',
      width: '100%',
      boxSizing: 'border-box',
      resize: 'vertical',
      background: '#fff',
      border: `1px solid ${focus ? 'var(--fuchsia-300)' : 'var(--surface-border-input)'}`,
      boxShadow: focus ? 'var(--shadow-focus-primary)' : 'none',
      outline: 0,
      borderRadius: 'var(--radius-md)',
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      lineHeight: '24px',
      color: 'var(--text-body)',
      padding: '8px 12px',
      ...style
    }
  }));
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Sidebar.jsx
try { (() => {
function Sidebar({
  brand = 'Soft UI Dashboard',
  sections = [],
  active,
  onSelect,
  style
}) {
  const [open, setOpen] = React.useState(() => {
    const o = {};
    sections.forEach(s => s.items.forEach(i => {
      if (i.children && (i.children.includes(active) || i.open)) o[i.label] = true;
    }));
    return o;
  });
  const tile = on => ({
    width: 32,
    height: 32,
    marginRight: 8,
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 'none',
    fontSize: 12,
    background: on ? 'var(--gradient-primary)' : '#fff',
    color: on ? '#fff' : 'var(--slate-700)',
    boxShadow: 'var(--shadow-sm)'
  });
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 256,
      boxSizing: 'border-box',
      fontFamily: 'var(--font-sans)',
      background: 'transparent',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '24px 32px',
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--slate-700)',
      whiteSpace: 'nowrap'
    }
  }, brand), /*#__PURE__*/React.createElement("hr", {
    style: {
      height: 1,
      border: 0,
      margin: '0 0 8px',
      background: 'linear-gradient(to right, transparent, rgba(0,0,0,.4), transparent)'
    }
  }), sections.map((s, si) => /*#__PURE__*/React.createElement("ul", {
    key: si,
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0
    }
  }, s.heading && /*#__PURE__*/React.createElement("li", {
    style: {
      padding: '16px 0 4px 32px',
      fontSize: 12,
      fontWeight: 700,
      lineHeight: 1.25,
      textTransform: 'uppercase',
      opacity: .6,
      color: 'var(--text-heading)'
    }
  }, s.heading), s.items.map(it => {
    const isOpen = !!open[it.label],
      on = it.label === active || it.children && it.children.includes(active);
    return /*#__PURE__*/React.createElement("li", {
      key: it.label,
      style: {
        marginTop: 2
      }
    }, /*#__PURE__*/React.createElement("a", {
      onClick: () => it.children ? setOpen({
        ...open,
        [it.label]: !isOpen
      }) : onSelect && onSelect(it.label),
      style: {
        display: 'flex',
        alignItems: 'center',
        margin: '0 16px',
        padding: '10.8px 16px',
        borderRadius: 'var(--radius-md)',
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--slate-700)',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        background: on && (!it.children || isOpen) ? '#fff' : 'transparent',
        boxShadow: on && (!it.children || isOpen) ? 'var(--shadow-xl)' : 'none',
        transition: 'all .2s var(--ease-soft)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: tile(on)
    }, /*#__PURE__*/React.createElement("i", {
      className: 'fa-solid ' + (it.icon || 'fa-circle')
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: 4
      }
    }, it.label), it.children && /*#__PURE__*/React.createElement("i", {
      className: "fa-solid fa-angle-down",
      style: {
        marginLeft: 'auto',
        fontSize: 12,
        color: 'var(--slate-800)',
        transform: isOpen ? 'rotate(180deg)' : 'none',
        transition: 'transform .2s'
      }
    })), it.children && isOpen && /*#__PURE__*/React.createElement("ul", {
      style: {
        listStyle: 'none',
        margin: 0,
        padding: '0 0 0 16px',
        marginLeft: 24
      }
    }, it.children.map(c => /*#__PURE__*/React.createElement("li", {
      key: c
    }, /*#__PURE__*/React.createElement("a", {
      onClick: () => onSelect && onSelect(c),
      style: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        margin: '0 16px 0 21.6px',
        padding: '6.4px 16px',
        fontSize: 14,
        fontWeight: c === active ? 600 : 400,
        color: c === active ? 'var(--slate-800)' : 'var(--text-body)',
        cursor: 'pointer',
        whiteSpace: 'nowrap'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        left: -20,
        top: '50%',
        width: 8,
        height: 8,
        marginTop: -4,
        borderRadius: 24,
        background: c === active ? 'var(--slate-800)' : 'var(--gray-300)'
      }
    }), c)))));
  }))));
}
Object.assign(__ds_scope, { Sidebar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Sidebar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function Tabs({
  tabs = [],
  value,
  onChange,
  style
}) {
  const idx = Math.max(0, tabs.indexOf(value));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      padding: 4,
      borderRadius: 'var(--radius-lg)',
      background: 'var(--gray-100)',
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 4,
      bottom: 4,
      left: 4,
      width: `calc((100% - 8px) / ${tabs.length || 1})`,
      transform: `translateX(${idx * 100}%)`,
      background: '#fff',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-sm)',
      transition: 'transform .25s var(--ease-soft)'
    }
  }), tabs.map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    onClick: () => onChange && onChange(t),
    style: {
      position: 'relative',
      flex: 1,
      padding: '6px 16px',
      border: 0,
      background: 'transparent',
      cursor: 'pointer',
      fontFamily: 'inherit',
      fontSize: 14,
      color: 'var(--slate-700)',
      fontWeight: t === value ? 600 : 400
    }
  }, t)));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Wizard.jsx
try { (() => {
function Wizard({
  steps = [],
  current = 0,
  onChange,
  children,
  onNext,
  onPrev,
  nextLabel = 'Next',
  prevLabel = 'Prev'
}) {
  const [cur, setCur] = React.useState(current);
  const go = n => {
    setCur(n);
    onChange && onChange(n);
  };
  const btn = grad => ({
    padding: '12px 24px',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-sans)',
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    cursor: 'pointer',
    border: grad ? '1px solid transparent' : '1px solid var(--slate-500)',
    background: grad ? 'var(--gradient-primary)' : 'transparent',
    color: grad ? '#fff' : 'var(--slate-500)',
    boxShadow: grad ? 'var(--shadow-md)' : 'none'
  });
  const kids = React.Children.toArray(children);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: `repeat(${steps.length},1fr)`,
      marginBottom: 24
    }
  }, steps.map((s, i) => {
    const done = i < cur,
      now = i === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: s,
      onClick: () => go(i),
      style: {
        position: 'relative',
        border: 0,
        background: 'transparent',
        cursor: 'pointer',
        padding: '24px 4px 0',
        fontFamily: 'inherit',
        fontSize: 14,
        fontWeight: now ? 700 : 400,
        color: now || done ? 'var(--text-heading)' : 'var(--slate-100)'
      }
    }, i < steps.length - 1 && /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        top: 6,
        left: '50%',
        width: '100%',
        height: 2,
        background: done ? 'var(--text-heading)' : 'var(--slate-100)'
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        top: 0,
        left: '50%',
        width: 13.6,
        height: 13.6,
        boxSizing: 'border-box',
        marginLeft: -6.8,
        borderRadius: '50%',
        background: now || done ? 'var(--text-heading)' : '#fff',
        border: `2px solid ${now || done ? 'var(--text-heading)' : 'var(--slate-100)'}`,
        transform: now ? 'scale(1.2)' : 'none'
      }
    }), s);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-card)',
      padding: 24
    }
  }, kids[cur], /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...btn(false),
      visibility: cur ? 'visible' : 'hidden'
    },
    onClick: () => {
      go(cur - 1);
      onPrev && onPrev();
    }
  }, prevLabel), /*#__PURE__*/React.createElement("button", {
    style: btn(true),
    onClick: () => {
      go(Math.min(steps.length - 1, cur + 1));
      onNext && onNext();
    }
  }, cur === steps.length - 1 ? 'Send' : nextLabel))));
}
Object.assign(__ds_scope, { Wizard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Wizard.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Avatar.jsx
try { (() => {
function Avatar({
  src,
  alt = '',
  size = 36,
  shape = 'rounded',
  stacked
}) {
  const circle = shape === 'circle';
  return /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: alt,
    style: {
      width: size,
      height: size,
      objectFit: 'cover',
      background: 'var(--slate-200)',
      borderRadius: circle ? '50%' : 'var(--radius-xl)',
      border: circle ? '2px solid #fff' : 0,
      marginLeft: stacked ? -16 : 0,
      boxSizing: 'border-box'
    }
  });
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Card.jsx
try { (() => {
function Card({
  padding = 24,
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-card)',
      padding,
      fontFamily: 'var(--font-sans)',
      color: 'var(--text-body)',
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Card.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Dropdown.jsx
try { (() => {
function Item({
  label,
  onClick
}) {
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      padding: '5px 16px',
      fontSize: 14,
      lineHeight: '24px',
      cursor: 'pointer',
      background: h ? 'var(--gray-200)' : 'transparent',
      color: h ? 'var(--slate-700)' : 'var(--text-body)'
    }
  }, label);
}
function Dropdown({
  items = [],
  onSelect,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-block',
      minWidth: 160,
      padding: '8px 0',
      background: '#fff',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-3xl)',
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, items.map(i => /*#__PURE__*/React.createElement(Item, {
    key: i,
    label: i,
    onClick: () => onSelect && onSelect(i)
  })));
}
Object.assign(__ds_scope, { Dropdown });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Dropdown.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Modal.jsx
try { (() => {
function Modal({
  title,
  footer,
  onClose,
  children,
  inline = false
}) {
  const box = /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    style: {
      width: '100%',
      maxWidth: 500,
      background: 'var(--surface-card)',
      border: '1px solid rgba(0,0,0,.2)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-3xl)',
      fontFamily: 'var(--font-sans)',
      color: 'var(--text-body)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottom: '1px solid var(--slate-100)'
    }
  }, /*#__PURE__*/React.createElement("h5", {
    style: {
      margin: 0,
      fontSize: 20,
      lineHeight: '27.5px',
      fontWeight: 600,
      color: 'var(--text-heading)'
    }
  }, title), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Close",
    style: {
      background: 'transparent',
      border: 0,
      fontSize: 20,
      lineHeight: 1,
      color: 'var(--text-body)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-xmark"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16,
      fontSize: 14,
      lineHeight: '24px'
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 8,
      padding: 16,
      borderTop: '1px solid var(--slate-100)'
    }
  }, footer));
  if (inline) return box;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      zIndex: 100
    }
  }, box);
}
Object.assign(__ds_scope, { Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Modal.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Navbar.jsx
try { (() => {
function Navbar({
  crumbs = [],
  title,
  right,
  style
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      padding: '12px 16px',
      background: 'rgba(255,255,255,.8)',
      backdropFilter: 'blur(40px) saturate(2)',
      WebkitBackdropFilter: 'blur(40px) saturate(2)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-2xl)',
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--slate-700)'
    }
  }, crumbs.map((c, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      opacity: i < crumbs.length - 1 ? .3 : 1
    }
  }, c, i < crumbs.length - 1 ? ' / ' : ''))), title && /*#__PURE__*/React.createElement("h6", {
    style: {
      margin: 0,
      fontSize: 16,
      lineHeight: '26px',
      fontWeight: 700,
      color: 'var(--slate-700)'
    }
  }, title)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16
    }
  }, right));
}
Object.assign(__ds_scope, { Navbar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Navbar.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Table.jsx
try { (() => {
function Table({
  title,
  columns = [],
  rows = []
}) {
  const th = {
    textAlign: 'left',
    padding: '8px 24px',
    fontSize: 10.4,
    fontWeight: 700,
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    opacity: .7,
    borderBottom: '1px solid var(--surface-border)'
  };
  const td = {
    padding: '12px 24px',
    fontSize: 14,
    lineHeight: '24px',
    color: 'var(--text-body)',
    borderBottom: '1px solid var(--surface-border)'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-card)',
      fontFamily: 'var(--font-sans)',
      overflow: 'hidden'
    }
  }, title && /*#__PURE__*/React.createElement("h6", {
    style: {
      margin: 0,
      padding: '24px 24px 12px',
      fontSize: 16,
      lineHeight: '26px',
      fontWeight: 600,
      color: 'var(--text-heading)'
    }
  }, title), /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse'
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, columns.map(c => /*#__PURE__*/React.createElement("th", {
    key: c,
    style: th
  }, c)))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: i
  }, r.map((c, j) => /*#__PURE__*/React.createElement("td", {
    key: j,
    style: td
  }, c)))))));
}
Object.assign(__ds_scope, { Table });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Table.jsx", error: String((e && e.message) || e) }); }

// ui_kits/apps/Common.jsx
try { (() => {
const DS = window.SoftUIDashboardDesignSystem_92ffef;
const Cap = ({
  children
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 10.4,
    lineHeight: '16px',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: 'var(--text-muted)'
  }
}, children);
const Big = ({
  children
}) => /*#__PURE__*/React.createElement("h5", {
  style: {
    margin: 0,
    fontSize: 20,
    lineHeight: '27.5px',
    fontWeight: 700,
    color: 'var(--text-heading)'
  }
}, children);
const H6 = ({
  children,
  style
}) => /*#__PURE__*/React.createElement("h6", {
  style: {
    margin: 0,
    fontSize: 14,
    lineHeight: '20px',
    fontWeight: 600,
    color: 'var(--text-heading)',
    ...style
  }
}, children);
const Delta = ({
  v
}) => /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 14,
    fontWeight: 700,
    color: String(v).startsWith('-') ? 'var(--red-500)' : 'var(--lime-500)'
  }
}, v);
const Stat = ({
  label,
  value,
  delta
}) => /*#__PURE__*/React.createElement(DS.Card, {
  padding: 16
}, /*#__PURE__*/React.createElement(Cap, null, label), /*#__PURE__*/React.createElement(Big, null, value, " ", delta && /*#__PURE__*/React.createElement(Delta, {
  v: delta
})));
const Ph = ({
  w = 48,
  h = 48,
  r = 8,
  style
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    width: w,
    height: h,
    borderRadius: r,
    background: 'var(--slate-200)',
    flex: 'none',
    ...style
  }
});
const Field = ({
  label,
  children
}) => /*#__PURE__*/React.createElement("label", {
  style: {
    display: 'grid',
    gap: 8
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--slate-700)',
    marginLeft: 4
  }
}, label), children);
const Title = ({
  children,
  sub
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    marginBottom: 16
  }
}, /*#__PURE__*/React.createElement("h5", {
  style: {
    margin: 0,
    fontSize: 20,
    lineHeight: '27.5px',
    fontWeight: 600,
    color: 'var(--text-heading)'
  }
}, children), sub && /*#__PURE__*/React.createElement("p", {
  style: {
    margin: '4px 0 0',
    fontSize: 14
  }
}, sub));
Object.assign(window, {
  DS,
  Cap,
  Big,
  H6,
  Delta,
  Stat,
  Ph,
  Field,
  Title
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/apps/Common.jsx", error: String((e && e.message) || e) }); }

// ui_kits/apps/Screens1.jsx
try { (() => {
const {
  Card,
  Chart,
  Table,
  Kanban,
  Button,
  Badge,
  Progress,
  Dropdown,
  Input,
  Textarea
} = DS;
function ProjectGeneral() {
  const proj = [['Check status', '24 March 2019', '2414_VR4sf3#', 'Creative Tim'], ['Management discussion', '24 March 2019', '4411_8sIsdd23', 'Apple'], ['New channel distribution', '25 March 2019', '827d_kdl33D1s', 'Slack'], ['IOS App development', '26 March 2019', '88s1_349DA2sa', 'Facebook']];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "g"
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(H6, null, "Earnings"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: '8px 0 0',
      fontSize: 48,
      lineHeight: '60px',
      color: 'var(--text-heading)'
    }
  }, "$15,800"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement(Delta, {
    v: "+15%"
  }), " since last week"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm"
  }, "View more"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 24,
      gridTemplateColumns: '1fr 1fr'
    }
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "Today's money",
    value: "$53,000"
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "Sessions",
    value: "9,600",
    delta: "+15%"
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "Today's users",
    value: "2,300",
    delta: "+3%"
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "Sign-ups",
    value: "348",
    delta: "+12%"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "g"
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Ph, {
    w: 36,
    h: 36,
    r: 999
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(H6, null, "Lucas Prila"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--text-muted)'
    }
  }, "2h ago"))), /*#__PURE__*/React.createElement(Cap, null, "Recommendation"), /*#__PURE__*/React.createElement(H6, null, "I need a Ruby developer for my new website."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      margin: '8px 0 16px'
    }
  }, "The website was initially built in PHP, I need a professional ruby programmer to shift it."), /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: '0 0 12px',
      fontSize: 24,
      color: 'var(--text-heading)'
    }
  }, "$3,000", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 400
    }
  }, " / month")), /*#__PURE__*/React.createElement(Button, {
    size: "sm"
  }, "Apply")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(H6, {
    style: {
      fontSize: 16,
      marginBottom: 4
    }
  }, "To do list"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--text-muted)',
      marginBottom: 12
    }
  }, "23 - 30 March 2020"), proj.map(([t, d, p, c]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: 'flex',
      gap: 12,
      padding: '10px 0',
      borderTop: '1px solid var(--surface-border)'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(H6, null, t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--text-muted)',
      display: 'flex',
      gap: 16,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", null, "Date ", /*#__PURE__*/React.createElement("b", null, d)), /*#__PURE__*/React.createElement("span", null, "Project ", /*#__PURE__*/React.createElement("b", null, p)), /*#__PURE__*/React.createElement("span", null, "Company ", /*#__PURE__*/React.createElement("b", null, c))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: 16
  }, /*#__PURE__*/React.createElement(Cap, null, "Tasks"), /*#__PURE__*/React.createElement(Big, null, "480"), /*#__PURE__*/React.createElement(Progress, {
    label: "",
    value: 60,
    color: "success"
  })), /*#__PURE__*/React.createElement(Card, {
    padding: 16
  }, /*#__PURE__*/React.createElement(Cap, null, "Projects"), /*#__PURE__*/React.createElement(Big, null, "115"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    color: "success"
  }, "Done"), /*#__PURE__*/React.createElement(Badge, {
    color: "info"
  }, "In progress"))))));
}
function Analytics() {
  const L = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  const sections = [['Social', [['Facebook', 80], ['Twitter', 40], ['Reddit', 30], ['Youtube', 25], ['Slack', 15]]]];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    color: "dark",
    size: "sm"
  }, "Export"), /*#__PURE__*/React.createElement(Button, {
    color: "dark",
    size: "sm"
  }, "Last 7 days")), /*#__PURE__*/React.createElement("div", {
    className: "g"
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "Users",
    value: "930",
    delta: "+55%"
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "New users",
    value: "744",
    delta: "+3%"
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "Sessions",
    value: "1,414",
    delta: "-2%"
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "Pages/Session",
    value: "1.76",
    delta: "+5%"
  })), /*#__PURE__*/React.createElement("div", {
    className: "g",
    style: {
      gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))'
    }
  }, /*#__PURE__*/React.createElement(Chart, {
    title: "Traffic channels",
    labels: L,
    series: [{
      data: [120, 90, 160, 210, 180, 240]
    }, {
      data: [60, 80, 90, 70, 120, 110]
    }, {
      data: [20, 40, 30, 60, 50, 90]
    }]
  }), /*#__PURE__*/React.createElement(Chart, {
    title: "Referrals",
    caption: "See which websites are sending traffic to your website",
    variant: "bar",
    labels: L,
    series: [{
      data: [25, 3, 12, 7, 10, 18]
    }]
  })), /*#__PURE__*/React.createElement("div", {
    className: "g",
    style: {
      gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))'
    }
  }, /*#__PURE__*/React.createElement(Table, {
    title: "Referrals",
    columns: ['Site', 'Share'],
    rows: [['Adobe', '25%'], ['Atlassian', '3%'], ['Slack', '12%'], ['Spotify', '7%'], ['Jira', '10%']]
  }), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(H6, {
    style: {
      fontSize: 16
    }
  }, "Social"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      margin: '4px 0 16px'
    }
  }, "See how much traffic do you get from social media"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 12
    }
  }, sections[0][1].map(([n, v], i) => /*#__PURE__*/React.createElement(Progress, {
    key: n,
    label: n,
    value: v,
    color: ['primary', 'info', 'danger', 'warning', 'success'][i]
  }))))), /*#__PURE__*/React.createElement(Table, {
    title: "Pages",
    columns: ['Page', 'Page views', 'Avg. time', 'Bounce rate'],
    rows: [['1. /bits', '345', '00:17:07', '40.91%'], ['2. /pages/argon-dashboard', '520', '00:23:13', '30.14%'], ['3. /pages/soft-ui-dashboard', '122', '00:3:10', '54.10%'], ['4. /bootstrap-themes', '1,900', '00:30:42', '20.93%'], ['5. /react-themes', '1,442', '00:31:50', '34.98%']]
  }));
}
function KanbanPage() {
  const cols = [{
    title: 'Backlog',
    cards: [{
      title: 'Click me to change title'
    }, {
      title: 'Soft UI XD Version',
      status: 'Pending',
      color: 'primary',
      assignees: 2
    }, {
      title: 'Argon Dashboard PRO',
      status: 'In Testing',
      color: 'warning',
      assignees: 3
    }]
  }, {
    title: 'In progress',
    cards: [{
      title: 'Fix Platform Errors',
      status: 'Errors',
      color: 'warning',
      assignees: 2
    }, {
      title: 'Release v1.2',
      status: 'Updates',
      color: 'info',
      assignees: 1
    }]
  }, {
    title: 'In review',
    cards: [{
      title: 'Design logo',
      status: 'In Review',
      color: 'success',
      assignees: 2
    }]
  }, {
    title: 'Done',
    cards: [{
      title: 'Product Checkout',
      status: 'Done',
      color: 'success',
      assignees: 3
    }]
  }];
  const [modal, setModal] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14
    }
  }, "Team members:"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex'
    }
  }, [0, 1, 2, 3].map(i => /*#__PURE__*/React.createElement(Ph, {
    key: i,
    w: 36,
    h: 36,
    r: 999,
    style: {
      border: '2px solid #fff',
      boxSizing: 'border-box',
      marginLeft: i ? -16 : 0
    }
  }))), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    onClick: () => setModal(true)
  }, "+ Add list")), /*#__PURE__*/React.createElement(Kanban, {
    columns: cols
  }), modal && /*#__PURE__*/React.createElement(DS.Modal, {
    title: "Choose your new Board Name",
    onClose: () => setModal(false),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "flat",
      color: "dark",
      onClick: () => setModal(false)
    }, "Close"), /*#__PURE__*/React.createElement(Button, {
      onClick: () => setModal(false)
    }, "Save changes"))
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "Board name"
  })));
}
Object.assign(window, {
  ProjectGeneral,
  Analytics,
  KanbanPage
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/apps/Screens1.jsx", error: String((e && e.message) || e) }); }

// ui_kits/apps/Screens2.jsx
try { (() => {
const {
  Card,
  Table,
  Datatable,
  Wizard,
  Input,
  Textarea,
  Select,
  RichTextEditor,
  Dropzone,
  Gallery,
  Badge,
  Button,
  Checkbox,
  Fullcalendar,
  Chart
} = DS;
const products = [['BKLGO Full Zip Hoodie', 'Clothing', '$1,321', '243598234', '0', 0], ['MacBook Pro', 'Electronics', '$1,869', '877712', '0', 0], ['Metro Bar Stool', 'Furniture', '$99', '0134729', '978', 1], ['Alchimia Chair', 'Furniture', '$2,999', '113213', '0', 0], ['Fendi Gradient Coat', 'Clothing', '$869', '634729', '725', 1], ['Off White Cotton Bomber', 'Clothing', '$1,869', '634729', '725', 1], ['Y-3 Yohji Yamamoto', 'Shoes', '$869', '634729', '725', 1], ['Alexander McQueen', 'Clothing', '$1,199', '00121399', '51293', 1]];
function ProductsList() {
  const rows = products.map(p => [/*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Checkbox, null), /*#__PURE__*/React.createElement(Ph, {
    w: 40,
    h: 40
  }), /*#__PURE__*/React.createElement(H6, null, p[0])), p[1], p[2], p[3], p[4], /*#__PURE__*/React.createElement(Badge, {
    color: p[5] ? 'success' : 'danger'
  }, p[5] ? 'In stock' : 'Out of stock'), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    color: "dark",
    size: "sm"
  }, "Edit")]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Title, {
    sub: "A lightweight, extendable, dependency-free javascript HTML table plugin."
  }, "All Products"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm"
  }, "+ New Product"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "outline",
    color: "dark"
  }, "Import"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "outline",
    color: "dark"
  }, "Export"))), /*#__PURE__*/React.createElement(Datatable, {
    columns: ['Product', 'Category', 'Price', 'SKU', 'Quantity', 'Status', 'Action'],
    rows: rows,
    perPageOptions: [5, 10]
  }));
}
function NewProduct() {
  const sel = (o, v) => /*#__PURE__*/React.createElement(Select, {
    options: o,
    value: v
  });
  return /*#__PURE__*/React.createElement(Wizard, {
    steps: ['1. Product Info', '2. Media', '3. Socials', '4. Pricing']
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Title, null, "Product Information"), /*#__PURE__*/React.createElement("div", {
    className: "g"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Name"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "eg. Off White"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Weight"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "eg. 42"
  }))), /*#__PURE__*/React.createElement(Field, {
    label: "Description (optional)"
  }, /*#__PURE__*/React.createElement(RichTextEditor, {
    html: "<p>Some initial <b>bold</b> text</p>",
    minHeight: 80
  })), /*#__PURE__*/React.createElement("div", {
    className: "g"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Category"
  }, sel(['Clothing', 'Real Estate', 'Electronics', 'Furniture', 'Others'], 'Clothing')), /*#__PURE__*/React.createElement(Field, {
    label: "Sizes"
  }, sel(['Medium', 'Small', 'Large', 'Extra Large', 'Extra Small'], 'Medium')))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Title, null, "Media"), /*#__PURE__*/React.createElement(Field, {
    label: "Product image"
  }, /*#__PURE__*/React.createElement(Dropzone, null))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Title, null, "Socials"), /*#__PURE__*/React.createElement(Field, {
    label: "Shoppify Handle"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "@soft"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Facebook Account"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "https://"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Instagram Account"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "https://"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Title, null, "Pricing"), /*#__PURE__*/React.createElement("div", {
    className: "g"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Price"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "99.00"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Currency"
  }, sel(['USD', 'EUR', 'GBP', 'CNY', 'INR', 'BTC'], 'USD'))), /*#__PURE__*/React.createElement("div", {
    className: "g"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "SKU"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "71283476591"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Tags"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "Add tags"
  })))));
}
function EditProduct() {
  const sel = (o, v) => /*#__PURE__*/React.createElement(Select, {
    options: o,
    value: v
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 16,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: 0,
      fontSize: 24,
      lineHeight: '33px',
      color: 'var(--text-heading)'
    }
  }, "Make the changes below"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      maxWidth: 520
    }
  }, "We're constantly trying to express ourselves and actualize our dreams. If you have the opportunity to play.")), /*#__PURE__*/React.createElement(Button, null, "Save")), /*#__PURE__*/React.createElement("div", {
    className: "g",
    style: {
      gridTemplateColumns: 'minmax(220px,1fr) 2fr'
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(Title, null, "Product Image"), /*#__PURE__*/React.createElement(Ph, {
    w: "100%",
    h: 220,
    r: 12
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    color: "dark"
  }, "Edit"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "outline",
    color: "danger"
  }, "Remove"))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(Title, null, "Product Information"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "g"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Name"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "Minimal Bar Stool"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Weight"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "2"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "g"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Collection"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "Summer"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Price"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "$90"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Quantity"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "50"
  }))), /*#__PURE__*/React.createElement(Field, {
    label: "Description (optional)"
  }, /*#__PURE__*/React.createElement(Textarea, {
    rows: 3,
    placeholder: "Long sleeves black denim jacket with a twisted design."
  })), /*#__PURE__*/React.createElement("div", {
    className: "g"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Category"
  }, sel(['Furniture', 'Real Estate', 'Electronics', 'Clothing', 'Others'], 'Furniture')), /*#__PURE__*/React.createElement(Field, {
    label: "Color"
  }, sel(['Black', 'White', 'Blue', 'Orange', 'Green'], 'Black')))))), /*#__PURE__*/React.createElement("div", {
    className: "g",
    style: {
      gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))'
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(Title, null, "Socials"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Shoppify Handle"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "@soft"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Facebook Account"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "https://"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Instagram Account"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "https://"
  })))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(Title, null, "Pricing"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "g"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Price"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "99.00"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Currency"
  }, sel(['USD', 'EUR', 'GBP'], 'USD'))), /*#__PURE__*/React.createElement("div", {
    className: "g"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "SKU"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "71283476591"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Tags"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "Add tags"
  })))))));
}
function NewUser() {
  const F = (l, p, t) => /*#__PURE__*/React.createElement(Field, {
    label: l
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: p,
    type: t
  }));
  return /*#__PURE__*/React.createElement(Wizard, {
    steps: ['User Info', 'Address', 'Socials', 'Profile']
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Title, {
    sub: "Mandatory informations"
  }, "About me"), /*#__PURE__*/React.createElement("div", {
    className: "g"
  }, F('First Name', 'eg. Michael'), F('Last Name', 'eg. Prior')), /*#__PURE__*/React.createElement("div", {
    className: "g"
  }, F('Company', 'eg. Creative Tim'), F('Email Address', 'eg. soft@dashboard.com', 'email')), /*#__PURE__*/React.createElement("div", {
    className: "g"
  }, F('Password', '******', 'password'), F('Repeat Password', '******', 'password'))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Title, null, "Address"), F('Address 1', 'eg. Street 111'), F('Address 2', 'eg. Street 221'), /*#__PURE__*/React.createElement("div", {
    className: "g"
  }, F('City', 'eg. Tokyo'), /*#__PURE__*/React.createElement(Field, {
    label: "State"
  }, /*#__PURE__*/React.createElement(Select, {
    options: ['State 1', 'State 2'],
    placeholder: "..."
  })), F('Zip', '7 letters'))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Title, null, "Socials"), F('Twitter Handle', '@soft'), F('Facebook Account', 'https://...'), F('Instagram Account', 'https://...')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Title, null, "Profile"), F('Public Email', "Use an address you don't use frequently."), /*#__PURE__*/React.createElement(Field, {
    label: "Bio"
  }, /*#__PURE__*/React.createElement(Textarea, {
    rows: 4,
    placeholder: "Say a few words about who you are or what you're working on."
  }))));
}
function WizardPage() {
  const [c, setC] = React.useState({
    Design: true
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontSize: 30,
      lineHeight: '41.25px',
      color: 'var(--text-heading)'
    }
  }, "Build Your Profile"), /*#__PURE__*/React.createElement("h5", {
    style: {
      margin: '4px 0 0',
      fontSize: 20,
      fontWeight: 400,
      color: 'var(--text-body)'
    }
  }, "This information will let us know more about you.")), /*#__PURE__*/React.createElement(Wizard, {
    steps: ['About', 'Account', 'Address']
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Title, {
    sub: "Let us know your name and email address. Use an address you don't mind other users contacting you at"
  }, "Let's start with the basic information"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Ph, {
    w: 120,
    h: 120,
    r: 999
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 240,
      display: 'grid',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "g"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "First Name"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "Eg. Michael"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Last Name"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "Eg. Tomson"
  }))), /*#__PURE__*/React.createElement(Field, {
    label: "Email Address"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "Eg. soft@dashboard.com"
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Title, {
    sub: "Give us more details about you. What do you enjoy doing in your spare time?"
  }, "What are you doing? (checkboxes)"), /*#__PURE__*/React.createElement("div", {
    className: "g"
  }, ['Design', 'Code', 'Develop'].map(n => /*#__PURE__*/React.createElement("div", {
    key: n,
    onClick: () => setC({
      ...c,
      [n]: !c[n]
    }),
    style: {
      cursor: 'pointer',
      textAlign: 'center',
      padding: 24,
      borderRadius: 'var(--radius-md)',
      border: `1px solid ${c[n] ? 'var(--slate-800)' : 'var(--gray-200)'}`,
      boxShadow: c[n] ? 'var(--shadow-md)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: 'fa-solid ' + {
      Design: 'fa-pen-ruler',
      Code: 'fa-code',
      Develop: 'fa-laptop-code'
    }[n],
    style: {
      fontSize: 24,
      color: 'var(--text-heading)'
    }
  }), /*#__PURE__*/React.createElement(H6, {
    style: {
      marginTop: 8
    }
  }, n))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Title, {
    sub: "One thing I love about the later sunsets is the chance to go for a walk through the neighborhood woods before dinner"
  }, "Are you living in a nice area?"), /*#__PURE__*/React.createElement("div", {
    className: "g"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Street Name"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "Eg. Soft"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Street No"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "Eg 221",
    type: "number"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "g"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "City"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "Eg Tokyo"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Country"
  }, /*#__PURE__*/React.createElement(Select, {
    options: ['Argentina', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Brasil'],
    placeholder: "Select country"
  }))))));
}
function CalendarPage() {
  const ev = [['Cyber Week', '21 March 2021, at 12:30 PM', 'warning'], ['Meeting with Marry', '24 March 2021, at 10:00 PM', 'info'], ['Book Deposit Hall', '25 March 2021, at 9:30 AM', 'danger'], ['Shipment Deal UK', '25 March 2021, at 2:00 PM', 'success'], ['Verify Dashboard Color Palette', '26 March 2021, at 9:00 AM', 'primary']];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14
    }
  }, "Team members:"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex'
    }
  }, [0, 1, 2, 3, 4].map(i => /*#__PURE__*/React.createElement(Ph, {
    key: i,
    w: 36,
    h: 36,
    r: 999,
    style: {
      border: '2px solid #fff',
      boxSizing: 'border-box',
      marginLeft: i ? -16 : 0
    }
  })))), /*#__PURE__*/React.createElement("div", {
    className: "g",
    style: {
      gridTemplateColumns: '2fr 1fr',
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement(Fullcalendar, {
    year: 2021,
    month: 2,
    events: [{
      day: 21,
      title: 'Cyber Week',
      color: 'warning'
    }, {
      day: 24,
      title: 'Meeting with Marry',
      color: 'info'
    }, {
      day: 25,
      title: 'Book Deposit Hall',
      color: 'danger'
    }, {
      day: 25,
      title: 'Shipment Deal UK',
      color: 'success'
    }, {
      day: 26,
      title: 'Verify Dashboard Color Palette',
      color: 'primary'
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(H6, {
    style: {
      fontSize: 16,
      marginBottom: 8
    }
  }, "Next events"), ev.map(([t, d, c]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: 'flex',
      gap: 12,
      padding: '8px 0'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 12,
      height: 12,
      borderRadius: '50%',
      marginTop: 4,
      background: `var(--gradient-${c})`,
      flex: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(H6, null, t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--text-muted)'
    }
  }, d))))), /*#__PURE__*/React.createElement(Chart, {
    title: "Productivity",
    caption: "4% more in 2021",
    labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug'],
    series: [{
      data: [50, 40, 300, 220, 500]
    }],
    height: 140
  }))));
}
function ProductPage() {
  const sel = (o, v) => /*#__PURE__*/React.createElement(Select, {
    options: o,
    value: v
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(Title, null, "Product Details"), /*#__PURE__*/React.createElement("div", {
    className: "g",
    style: {
      gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))',
      gap: 32
    }
  }, /*#__PURE__*/React.createElement(Gallery, {
    images: [null, null, null, null, null]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 12,
      alignContent: 'start'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontSize: 30,
      lineHeight: '41.25px',
      color: 'var(--text-heading)'
    }
  }, "Minimal Bar Stool"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(H6, null, "Price"), /*#__PURE__*/React.createElement(Big, null, "$1,419")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Badge, {
    color: "success"
  }, "In Stock")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(H6, null, "Description"), /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: '4px 0 0',
      paddingLeft: 20,
      fontSize: 14,
      lineHeight: '24px'
    }
  }, /*#__PURE__*/React.createElement("li", null, "The most beautiful curves of this swivel stool adds an elegant touch to any environment"), /*#__PURE__*/React.createElement("li", null, "Memory swivel seat returns to original seat position"), /*#__PURE__*/React.createElement("li", null, "Comfortable integrated layered chair seat cushion design"), /*#__PURE__*/React.createElement("li", null, "Fully assembled! No assembly required"))), /*#__PURE__*/React.createElement("div", {
    className: "g"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Frame Material"
  }, sel(['Wood', 'Steel', 'Aluminium', 'Carbon'], 'Wood')), /*#__PURE__*/React.createElement(Field, {
    label: "Color"
  }, sel(['White', 'Gray', 'Black', 'Blue', 'Red', 'Pink'], 'White')), /*#__PURE__*/React.createElement(Field, {
    label: "Quantity"
  }, sel(['1', '2', '3', '4', '5'], '1'))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Button, null, "Add to cart"))))), /*#__PURE__*/React.createElement(Table, {
    title: "Other Products",
    columns: ['Product', 'Price', 'Review', 'Availability', 'ID'],
    rows: [['Christopher Knight Home', '$89.53', '★★★★☆', 'In stock', '230019'], ['Bar Height Swivel Barstool', '$99.99', '★★★★★', 'In stock', '87120'], ['Signature Design by Ashley', '$129.00', '★★★☆☆', 'In stock', '412301'], ['Modern Square', '$59.99', '★★★★☆', 'In stock', '001992']]
  }));
}
Object.assign(window, {
  ProductsList,
  NewProduct,
  EditProduct,
  ProductPage,
  NewUser,
  WizardPage,
  CalendarPage
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/apps/Screens2.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Chart = __ds_scope.Chart;

__ds_ns.CountUp = __ds_scope.CountUp;

__ds_ns.Datatable = __ds_scope.Datatable;

__ds_ns.Fullcalendar = __ds_scope.Fullcalendar;

__ds_ns.Gallery = __ds_scope.Gallery;

__ds_ns.Kanban = __ds_scope.Kanban;

__ds_ns.Three = __ds_scope.Three;

__ds_ns.Alert = __ds_scope.Alert;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Progress = __ds_scope.Progress;

__ds_ns.SweetAlert = __ds_scope.SweetAlert;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Datepicker = __ds_scope.Datepicker;

__ds_ns.Dropzone = __ds_scope.Dropzone;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.RichTextEditor = __ds_scope.RichTextEditor;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Sliders = __ds_scope.Sliders;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.Sidebar = __ds_scope.Sidebar;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.Wizard = __ds_scope.Wizard;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Dropdown = __ds_scope.Dropdown;

__ds_ns.Modal = __ds_scope.Modal;

__ds_ns.Navbar = __ds_scope.Navbar;

__ds_ns.Table = __ds_scope.Table;

})();
