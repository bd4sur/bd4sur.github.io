function Typograms() {
    var t;
    const e = {
        "|": ([t,e,n,s,i,o,l,c])=>{
            const u = document.createElementNS("http://www.w3.org/2000/svg", "g");
            if ("_" == e) {
                const t = document.createElementNS("http://www.w3.org/2000/svg", "line");
                t.setAttribute("x1", "18"),
                t.setAttribute("y1", "51"),
                t.setAttribute("x2", "30"),
                t.setAttribute("y2", "51"),
                t.setAttribute("class", "part"),
                u.appendChild(t)
            }
            if ("_" == s) {
                const t = document.createElementNS("http://www.w3.org/2000/svg", "line");
                t.setAttribute("x1", "0"),
                t.setAttribute("y1", "51"),
                t.setAttribute("x2", "12"),
                t.setAttribute("y2", "51"),
                t.setAttribute("class", "part"),
                u.appendChild(t)
            }
            if ("_" == i) {
                const t = document.createElementNS("http://www.w3.org/2000/svg", "line");
                t.setAttribute("x1", "12"),
                t.setAttribute("y1", "-3"),
                t.setAttribute("x2", "30"),
                t.setAttribute("y2", "-3"),
                t.setAttribute("class", "part"),
                u.appendChild(t)
            }
            if ("_" == c) {
                const t = document.createElementNS("http://www.w3.org/2000/svg", "line");
                t.setAttribute("x1", "0"),
                t.setAttribute("y1", "-3"),
                t.setAttribute("x2", "18"),
                t.setAttribute("y2", "-3"),
                t.setAttribute("class", "part"),
                u.appendChild(t)
            }
            return u.appendChild(r([!("/" == i && "\\" == c), ["-"].includes(e), !("/" == l && "\\" == o), ["-"].includes(s), "/" == i, "\\" == o, "/" == l, "\\" == c])),
            u
        }
        ,
        "-": ([t,e,n,s,i,o,l,c])=>r([["|"].includes(t), !0, ["|"].includes(n), !0, !1, !1, !1, !1]),
        "~": ([t,e,n,r,s,i,o,l])=>{
            const c = document.createElementNS("http://www.w3.org/2000/svg", "g")
              , u = document.createElementNS("http://www.w3.org/2000/svg", "line");
            return u.setAttribute("x1", "9"),
            u.setAttribute("y1", "27"),
            u.setAttribute("x2", "24"),
            u.setAttribute("y2", "27"),
            u.setAttribute("class", "part"),
            c.appendChild(u),
            c
        }
        ,
        _: t=>{
            const n = e["-"](t);
            return n.setAttribute("transform", "translate(0 24)"),
            n
        }
        ,
        ":": ([t,e,n,r,s,i,o,l])=>{
            const c = document.createElementNS("http://www.w3.org/2000/svg", "g")
              , u = document.createElementNS("http://www.w3.org/2000/svg", "line");
            if (u.setAttribute("x1", "15"),
            u.setAttribute("y1", "0"),
            u.setAttribute("x2", "15"),
            u.setAttribute("y2", "60"),
            u.setAttribute("class", "part"),
            u.setAttribute("style", "stroke-dasharray: 15; stroke-dashoffset: 0;"),
            c.appendChild(u),
            "+" == t) {
                const t = document.createElementNS("http://www.w3.org/2000/svg", "line");
                t.setAttribute("x1", "15"),
                t.setAttribute("y1", "-24"),
                t.setAttribute("x2", "15"),
                t.setAttribute("y2", "-15"),
                t.setAttribute("class", "part"),
                c.appendChild(t)
            }
            if ("+" == n) {
                const t = document.createElementNS("http://www.w3.org/2000/svg", "line");
                t.setAttribute("x1", "15"),
                t.setAttribute("y1", "60"),
                t.setAttribute("x2", "15"),
                t.setAttribute("y2", "78"),
                t.setAttribute("class", "part"),
                c.appendChild(t)
            }
            return c
        }
        ,
        "=": t=>{
            const e = document.createElementNS("http://www.w3.org/2000/svg", "g")
              , n = document.createElementNS("http://www.w3.org/2000/svg", "line");
            n.setAttribute("x1", "0"),
            n.setAttribute("y1", "21"),
            n.setAttribute("x2", "30"),
            n.setAttribute("y2", "21"),
            n.setAttribute("class", "part"),
            e.appendChild(n);
            const r = document.createElementNS("http://www.w3.org/2000/svg", "line");
            return r.setAttribute("x1", "0"),
            r.setAttribute("y1", "30"),
            r.setAttribute("x2", "30"),
            r.setAttribute("y2", "30"),
            r.setAttribute("class", "part"),
            e.appendChild(r),
            e
        }
        ,
        "*": ([t,e,n,s,i,o,l,c])=>{
            const u = document.createElementNS("http://www.w3.org/2000/svg", "g")
              , p = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            return p.setAttribute("cx", "0"),
            p.setAttribute("cy", "0"),
            p.setAttribute("r", "21"),
            p.setAttribute("stroke", "none"),
            p.setAttribute("transform", "translate(15, 27)"),
            u.appendChild(p),
            u.appendChild(r([["+", "|"].includes(t), ["+", "-"].includes(e), ["+", "|"].includes(n), ["+", "-"].includes(s), ["/"].includes(i), ["\\"].includes(o), ["/"].includes(l), ["\\"].includes(c)])),
            u
        }
        ,
        o: ([t,e,n,s,i,o,l,c])=>{
            const u = document.createElementNS("http://www.w3.org/2000/svg", "g")
              , p = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            p.setAttribute("cx", "0"),
            p.setAttribute("cy", "0"),
            p.setAttribute("r", "18"),
            p.setAttribute("stroke-width", "6"),
            p.setAttribute("fill", "none"),
            p.setAttribute("stroke", "black"),
            p.setAttribute("transform", "translate(15, 27)"),
            u.appendChild(p);
            const a = r([["+", "|"].includes(t), ["+", "-"].includes(e), ["+", "|"].includes(n), ["+", "-"].includes(s), ["/"].includes(i), ["\\"].includes(o), ["/"].includes(l), ["\\"].includes(c)]);
            u.appendChild(a);
            const d = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            return d.setAttribute("cx", "0"),
            d.setAttribute("cy", "0"),
            d.setAttribute("r", "15"),
            d.setAttribute("fill", "white"),
            d.setAttribute("opacity", "100%"),
            d.setAttribute("transform", "translate(15, 27)"),
            u.appendChild(d),
            u
        }
        ,
        "/": t=>{
            const [n,s,i,o,l,c,u,p] = t
              , a = document.createElementNS("http://www.w3.org/2000/svg", "g");
            if (a.appendChild(r([["|"].includes(n), !1, ["|"].includes(i), !1, !0, !1, !0, !1])),
            "\\" == s) {
                const t = r([!1, !1, !1, !1, !1, !1, !0, !1]);
                t.setAttribute("transform", "translate(30 -54)"),
                t.setAttribute("clip-path", "polygon(-3 0, 0 0, 0 54, -3 54)"),
                a.appendChild(t)
            }
            if ("\\" == o) {
                const t = r([!1, !1, !1, !1, !0, !1, !1, !1]);
                t.setAttribute("transform", "translate(-30 54)"),
                t.setAttribute("clip-path", "polygon(15 -6, 33 -6, 33 6, 15 6)"),
                a.appendChild(t)
            }
            if ("_" == s) {
                const n = e._(t);
                a.appendChild(n)
            }
            return a
        }
        ,
        "\\": t=>{
            const [n,s,i,o,l,c,u,p] = t
              , a = document.createElementNS("http://www.w3.org/2000/svg", "g");
            if (a.appendChild(r([["|"].includes(n), !1, ["|"].includes(i), !1, !1, !0, !1, !0])),
            "/" == o) {
                const t = r([!1, !1, !1, !1, !1, !0, !1, !1]);
                t.setAttribute("transform", "translate(-30 -54)"),
                t.setAttribute("clip-path", "polygon(15 0, 30 0, 30 54, 15 54)"),
                a.appendChild(t)
            }
            if ("/" == s) {
                const t = r([!1, !1, !1, !1, !1, !1, !1, !0]);
                t.setAttribute("transform", "translate(30 54)"),
                t.setAttribute("clip-path", "polygon(-3 0, 0 0, 0 6, -3 6)"),
                a.appendChild(t)
            }
            if ("_" == o) {
                const n = e._(t);
                a.appendChild(n)
            }
            return a
        }
        ,
        "#": ([t,e,n,s,i,o,l,c])=>{
            const u = document.createElementNS("http://www.w3.org/2000/svg", "g")
              , p = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            return p.setAttribute("points", [[0, 0], [42, 0], [42, 42], [0, 42]].map(([t,e])=>`${t},${e}`).join(" ")),
            p.setAttribute("transform", "translate(-6, 6)"),
            u.appendChild(p),
            u.appendChild(r([["+", "|"].includes(t), ["+", "-"].includes(e), ["+", "|"].includes(n), ["+", "-"].includes(s), ["/"].includes(i), ["\\"].includes(o), ["/"].includes(l), ["\\"].includes(c)])),
            u
        }
        ,
        "+": ([t,e,n,s,i,o,l,c])=>{
            const u = document.createElementNS("http://www.w3.org/2000/svg", "g")
              , p = ["*", "#", "-", "+", "~", ">", ".", "'", "`"].includes(e)
              , a = ["*", "#", "-", "+", "~", "<", ".", "'", "`"].includes(s)
              , d = ["*", "#", "|", "+", ".", "`", "^"].includes(t)
              , w = ["*", "#", "|", "+", "'", "`", "v"].includes(n)
              , g = ["/", "*", "#"].includes(i)
              , b = ["\\", "*", "#"].includes(o)
              , A = ["\\", "*", "#"].includes(c)
              , h = ["/", "*", "#"].includes(l);
            if (u.appendChild(r([d, p, w, a, g, b, h, A])),
            (a || p) && (w || d)) {
                const t = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
                t.setAttribute("points", "0,0 6,0 6,6 0,6"),
                t.setAttribute("transform", "translate(-3 -3) translate(15 27)"),
                u.appendChild(t)
            }
            if (g || A) {
                const t = r([!1, !1, !1, !1, !1, A, g, !1]);
                t.setAttribute("clip-path", "polygon(0 -3, 30 -3, 30 0, 0 0)"),
                u.appendChild(t)
            }
            if (b || h) {
                const t = r([!1, !1, !1, !1, h, !1, !1, b]);
                t.setAttribute("clip-path", "polygon(0 27, 15 27, 15 30, 0 30)"),
                u.appendChild(t)
            }
            if (h || A) {
                const t = r([!1, !1, !1, !1, h && b, A && g, !1, !1]);
                t.setAttribute("clip-path", "polygon(-3 0, 0 0, 0 54, -3 54)"),
                u.appendChild(t)
            }
            if (b || g) {
                const t = r([!1, !1, !1, !1, !1, !1, g && A, b && h]);
                t.setAttribute("clip-path", "polygon(15 0, 30 0, 30 54, 15 54)"),
                u.appendChild(t)
            }
            if (p || a) {
                const t = r([!1, !1, !1, !1, p || h, A, g, a || b]);
                t.setAttribute("clip-path", "polygon(-3 24, 30 24, 30 30, -3 30)"),
                u.appendChild(t)
            }
            return u
        }
        ,
        ".": ([t,e,n,s,i,o,l,c])=>{
            const u = document.createElementNS("http://www.w3.org/2000/svg", "g");
            if (!("-" != e && "+" != e || "|" != n && "'" != n && "`" != n && "+" != n)) {
                const t = document.createElementNS("http://www.w3.org/2000/svg", "path");
                t.setAttribute("d", "\n        M 30 24\n        A 18 18, 0, 0, 0, 12 42\n        L 12 54\n        L 18 54\n        L 18 42\n        A 12 12, 0, 0, 1, 30 30\n        Z"),
                u.appendChild(t)
            }
            if (!("-" != s && "+" != s || "|" != n && "'" != n && "`" != n && "+" != n)) {
                const t = document.createElementNS("http://www.w3.org/2000/svg", "path");
                t.setAttribute("d", "\n        M 0 24\n        A 18 18, 0, 0, 1, 18 42\n        L 18 54\n        L 12 54\n        L 12 42\n        A 12 12, 0, 0, 0, 0 30        \n        Z"),
                u.appendChild(t)
            }
            if (!("-" != e && "+" != e || "|" != t && "." != t && "+" != t)) {
                const t = document.createElementNS("http://www.w3.org/2000/svg", "path");
                t.setAttribute("d", "\n        M 30 30\n        A 18 18, 0, 0, 1, 12 12\n        L 12 0\n        L 18 0\n        L 18 12\n        A 12 12, 0, 0, 0, 30 24\n        Z"),
                u.appendChild(t)
            }
            if (!("-" != s && "+" != s || "|" != t && "." != t && "+" != t)) {
                const t = document.createElementNS("http://www.w3.org/2000/svg", "path");
                t.setAttribute("d", "\n        M 0 30\n        A 18 18, 0, 0, 0, 18 12\n        L 18 0\n        L 12 0\n        L 12 12\n        A 12 12, 0, 0, 1, 0 24\n        Z"),
                u.appendChild(t)
            }
            if ("-" == e && "/" == i) {
                const t = document.createElementNS("http://www.w3.org/2000/svg", "path");
                t.setAttribute("d", "\n        M 30 30\n        A 12 12, 0, 0, 1, 18 18\n        L 18 15\n        L 24 15\n        L 24 18\n        A 6 6, 0, 0, 0, 30 24\n        Z"),
                u.appendChild(t);
                const e = r([!1, !1, !1, !1, !0, !1, !1, !1]);
                e.setAttribute("clip-path", "polygon(15px -10px, 30px -10px, 30px 30px, 2px 15px)"),
                u.appendChild(e)
            }
            if ("-" == e && "\\" == c) {
                const t = document.createElementNS("http://www.w3.org/2000/svg", "path");
                t.setAttribute("d", "\n        M -3 0\n        A 60 60, 0, 0, 0, 30 30\n        L 30 24\n        A 60 60, 0, 0, 1, 0 -6\n        Z"),
                u.appendChild(t)
            }
            if ("-" == s && "/" == i) {
                const t = document.createElementNS("http://www.w3.org/2000/svg", "path");
                t.setAttribute("d", "\n        M 0 30\n        A 60 60, 0, 0, 0, 33 0\n        L 30 -6\n        A 60 60, 0, 0, 1, 0 24\n        Z"),
                u.appendChild(t)
            }
            if ("-" == s && "\\" == c) {
                const t = document.createElementNS("http://www.w3.org/2000/svg", "path");
                t.setAttribute("d", "\n        M 0 30\n        A 12 12, 0, 0, 0, 12 18\n        L 12 15\n        L 6 15\n        L 6 18\n        A 6 6, 0, 0, 1, 0 24\n        Z"),
                u.appendChild(t);
                const e = r([!1, !1, !1, !1, !1, !1, !1, !0]);
                e.setAttribute("clip-path", "polygon(-3 -3, 12 -3, 12 18, -3 18)"),
                u.appendChild(e)
            }
            if ("|" == n && "/" == i) {
                const t = document.createElementNS("http://www.w3.org/2000/svg", "path");
                t.setAttribute("d", "\n        M 12 54\n        A 120 120, 0, 0, 1, 30 -6\n        L 37 -6\n        A 120 120, 0, 0, 0, 18 54\n        Z"),
                u.appendChild(t)
            }
            if ("|" == t && "\\" == o) {
                const t = document.createElementNS("http://www.w3.org/2000/svg", "path");
                t.setAttribute("d", "\n        M 30 60\n        A 120 120, 0, 0, 1, 12 0\n        L 18 0\n        A 120 120, 0, 0, 0, 37 60\n        Z"),
                u.appendChild(t)
            }
            if ("|" == t && "/" == l) {
                const t = document.createElementNS("http://www.w3.org/2000/svg", "path");
                t.setAttribute("d", "\n        M 0 60\n        A 120 120, 0, 0, 0, 18 0\n        L 12 0\n        A 120 120, 0, 0, 1, -7 60\n        Z"),
                u.appendChild(t)
            }
            if ("|" == n && "\\" == c) {
                const t = document.createElementNS("http://www.w3.org/2000/svg", "path");
                t.setAttribute("d", "\n        M 12 54\n        A 120 120, 0, 0, 0, -7 -6\n        L 0 -6\n        A 120 120, 0, 0, 1, 18 54\n        Z"),
                u.appendChild(t)
            }
            if ("-" == e && "/" == l) {
                const t = document.createElementNS("http://www.w3.org/2000/svg", "path");
                t.setAttribute("d", "\n        M 0 48\n        A 42 42, 0, 0, 1, 30 24\n        L 30 30\n        A 42 42, 0, 0, 0, 6 48\n        Z"),
                u.appendChild(t);
                const e = r([!1, !1, !1, !1, !1, !1, !0, !1]);
                e.setAttribute("clip-path", "polygon(-3 15, 12 15, 12 30, -3 30)"),
                u.appendChild(e)
            }
            if ("-" == s && "\\" == o) {
                const t = document.createElementNS("http://www.w3.org/2000/svg", "path");
                t.setAttribute("d", "\n        M 0 24\n        A 42 42, 0, 0, 1, 30 48\n        L 24 48\n        A 42 42, 0, 0, 0, 0 30\n        Z"),
                u.appendChild(t);
                const e = r([!1, !1, !1, !1, !1, !0, !1, !1]);
                e.setAttribute("clip-path", "polygon(-3 15, 12 15, 21 30, -3 30)"),
                u.appendChild(e)
            }
            if ("-" == s && "/" == l) {
                const t = document.createElementNS("http://www.w3.org/2000/svg", "path");
                t.setAttribute("d", "\n        M 0 24\n        A 12 12, 0, 0, 1, 12 39\n        L 6 39\n        A 6 6, 0, 0, 0, 0 30\n        Z"),
                u.appendChild(t);
                const e = r([!1, !1, !1, !1, !1, !1, !0, !1]);
                e.setAttribute("clip-path", "polygon(-3 6, 12 6, 12 30, -3 30)"),
                u.appendChild(e)
            }
            if ("-" == e && "\\" == o) {
                const t = document.createElementNS("http://www.w3.org/2000/svg", "path");
                t.setAttribute("d", "\n        M 30 24\n        A 12 12, 0, 0, 0, 18 39\n        L 24 39\n        A 6 6, 0, 0, 1, 30 30 \n        Z"),
                u.appendChild(t);
                const e = r([!1, !1, !1, !1, !1, !0, !1, !1]);
                e.setAttribute("clip-path", "polygon(3 6, 18 6, 18 30, 3 30)"),
                u.appendChild(e)
            }
            if ("/" == l && "\\" == o) {
                const t = document.createElementNS("http://www.w3.org/2000/svg", "path");
                t.setAttribute("d", "\n        M 3 42\n        A 15 15, 0, 0, 1, 27 42\n        L 25 51\n        A 9 9, 0, 0, 0, 5 51\n        Z"),
                u.appendChild(t);
                const e = r([!1, !1, !1, !1, !1, !0, !0, !1]);
                e.setAttribute("clip-path", "polygon(-3 15, 33 15, 33 30, -3 30)"),
                u.appendChild(e)
            }
            if ("\\" == c && "/" == i) {
                const t = document.createElementNS("http://www.w3.org/2000/svg", "path");
                t.setAttribute("d", "\n        M 3 12\n        A 15 15, 0, 0, 0, 27 12\n        L 22 9\n        A 9 9, 0, 0, 1, 8 9\n        Z"),
                u.appendChild(t);
                const e = r([!1, !1, !1, !1, !0, !1, !1, !0]);
                e.setAttribute("clip-path", "polygon(-3 -3, 33 -3, 33 12, -3 12)"),
                u.appendChild(e)
            }
            if ("/" == i && "\\" == o) {
                const t = document.createElementNS("http://www.w3.org/2000/svg", "path");
                t.setAttribute("d", "\n        M 22 9\n        A 30 30, 0, 0, 0, 22 45\n        L 28 45\n        A 30 30, 0, 0, 1, 28 9\n        Z"),
                u.appendChild(t);
                const e = r([!1, !1, !1, !1, !0, !0, !1, !1]);
                e.setAttribute("clip-path", "polygon(6 -3, 33 -3, 33 57, 6 57)"),
                u.appendChild(e)
            }
            if ("\\" == c && "/" == l) {
                const t = document.createElementNS("http://www.w3.org/2000/svg", "path");
                t.setAttribute("d", "\n        M 8 9\n        A 30 30, 0, 0, 1, 8 45\n        L 2 45\n        A 30 30, 0, 0, 0, 2 9\n        Z"),
                u.appendChild(t);
                const e = r([!1, !1, !1, !1, !1, !1, !0, !0]);
                e.setAttribute("clip-path", "polygon(-3 -3, 9 -3, 9 57, -3 57)"),
                u.appendChild(e)
            }
            return u
        }
    }
      , n = {
        "\u250c": "+",
        "\u2510": "+",
        "\u2514": "+",
        "\u2518": "+",
        "\u2500": "-",
        "\u25ba": ">",
        "'": ".",
        "`": ".",
        V: "v"
    };
    for (const [o,l] of Object.entries(n))
        e[o] = t=>e[l](t);
    function r([t,e,n,r,s,i,o,l]) {
        const c = document.createElementNS("http://www.w3.org/2000/svg", "g");
        if (t) {
            const t = document.createElementNS("http://www.w3.org/2000/svg", "line");
            t.setAttribute("x1", 15),
            t.setAttribute("y1", 0),
            t.setAttribute("x2", 15),
            t.setAttribute("y2", 27),
            t.setAttribute("class", "part"),
            c.appendChild(t)
        }
        if (e) {
            const t = document.createElementNS("http://www.w3.org/2000/svg", "line");
            t.setAttribute("x1", 15),
            t.setAttribute("y1", 27),
            t.setAttribute("x2", 30),
            t.setAttribute("y2", 27),
            t.setAttribute("class", "part"),
            c.appendChild(t)
        }
        if (n) {
            const t = document.createElementNS("http://www.w3.org/2000/svg", "line");
            t.setAttribute("x1", 15),
            t.setAttribute("y1", 27),
            t.setAttribute("x2", 15),
            t.setAttribute("y2", 54),
            t.setAttribute("class", "part"),
            c.appendChild(t)
        }
        if (r) {
            const t = document.createElementNS("http://www.w3.org/2000/svg", "line");
            t.setAttribute("x1", 0),
            t.setAttribute("y1", 27),
            t.setAttribute("x2", 15),
            t.setAttribute("y2", 27),
            t.setAttribute("class", "part"),
            c.appendChild(t)
        }
        if (document.createElementNS("http://www.w3.org/2000/svg", "polygon").setAttribute("points", [[0, 0], [20.6, 0], [20.6, 3], [0, 3]].map(([t,e])=>`${t},${e}`).join(" ")),
        s) {
            const t = document.createElementNS("http://www.w3.org/2000/svg", "line");
            t.setAttribute("x1", 30),
            t.setAttribute("y1", 0),
            t.setAttribute("x2", 15),
            t.setAttribute("y2", 27),
            t.setAttribute("class", "part"),
            c.appendChild(t)
        }
        if (i) {
            const t = document.createElementNS("http://www.w3.org/2000/svg", "line");
            t.setAttribute("x1", 15),
            t.setAttribute("y1", 27),
            t.setAttribute("x2", 30),
            t.setAttribute("y2", 54),
            t.setAttribute("class", "part"),
            c.appendChild(t)
        }
        if (o) {
            const t = document.createElementNS("http://www.w3.org/2000/svg", "line");
            t.setAttribute("x1", 15),
            t.setAttribute("y1", 27),
            t.setAttribute("x2", 0),
            t.setAttribute("y2", 54),
            t.setAttribute("class", "part"),
            c.appendChild(t)
        }
        if (l) {
            const t = document.createElementNS("http://www.w3.org/2000/svg", "line");
            t.setAttribute("x1", 0),
            t.setAttribute("y1", 0),
            t.setAttribute("x2", 15),
            t.setAttribute("y2", 27),
            t.setAttribute("class", "part"),
            c.appendChild(t)
        }
        return c
    }
    function s(t, e) {
        const n = document.createElementNS("http://www.w3.org/2000/svg", "g")
          , r = document.createElementNS("http://www.w3.org/2000/svg", "text")
          , s = document.createTextNode(t);
        return r.appendChild(s),
        e && r.setAttribute("class", "reserved"),
        r.setAttribute("transform", [[15, 24]].map(([t,e])=>`translate(${t}, ${e})`).join(" ")),
        n.appendChild(r),
        n
    }
    function i(t, [e,n]) {
        let r = " "
          , s = " "
          , i = " "
          , o = " "
          , l = " "
          , c = " "
          , u = " "
          , p = " ";
        return n > 0 && (s = t[n - 1][e] || " "),
        e < t[n].length - 1 && (i = t[n][e + 1] || " "),
        n < t.length - 1 && (o = t[n + 1][e] || " "),
        e > 0 && (r = t[n][e - 1] || " "),
        n > 0 && e < t[n - 1].length - 1 && (l = t[n - 1][e + 1] || " "),
        n + 1 < t.length && e < t[n + 1].length && (c = t[n + 1][e + 1] || " "),
        n < t.length - 1 && e > 0 && (u = t[n + 1][e - 1] || " "),
        n > 0 && e > 0 && (p = t[n - 1][e - 1] || " "),
        [s, i, o, r, l, c, u, p]
    }
    e[">"] = ([t,e,n,r,s,i,o,l])=>{
        const c = document.createElementNS("http://www.w3.org/2000/svg", "g")
          , u = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        u.setAttribute("points", "0,0 42,18 0,36");
        let p = 0;
        return "*" != e && "o" != e && "#" != e || (p -= 18),
        u.setAttribute("transform", `translate(${p} 9)`),
        c.appendChild(u),
        c
    }
    ,
    e["<"] = ([t,e,n,r,s,i,o,l])=>{
        const c = document.createElementNS("http://www.w3.org/2000/svg", "g")
          , u = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        u.setAttribute("points", "0,0 42,18 0,36");
        let p = 30;
        return "*" != r && "o" != r && "#" != r || (p += 18),
        u.setAttribute("transform", `translate(${p} 9) translate(0 36) rotate(180)`),
        c.appendChild(u),
        c
    }
    ,
    e.v = ([t,e,n,s,i,o,l,c])=>{
        const u = document.createElementNS("http://www.w3.org/2000/svg", "g")
          , p = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        p.setAttribute("points", "0,0 42,18 0,36");
        let a = 36;
        return " " == n ? a = 12 : "_" == n ? a += 18 : "*" != n && "o" != n && "#" != n || (a -= 18),
        "/" == i ? p.setAttribute("transform", "translate(-36 33) rotate(112.5, 42, 18)") : "\\" == c ? p.setAttribute("transform", "translate(-18 33) rotate(67.5, 42, 18)") : p.setAttribute("transform", `translate(33 ${a}) rotate(90)`),
        u.appendChild(p),
        u.appendChild(r([["|", "+"].includes(t), !1, ["|", "+"].includes(t), !1, ["/"].includes(i), !1, !1, ["\\"].includes(c)])),
        u
    }
    ,
    e["^"] = ([t,e,n,s,i,o,l,c])=>{
        const u = document.createElementNS("http://www.w3.org/2000/svg", "g")
          , p = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        p.setAttribute("points", "0,0 42,18 0,36");
        let a = 42;
        return "-" == t && (a -= 15),
        "/" == l ? p.setAttribute("transform", "translate(-18 -15) rotate(-67.5, 42, 18)") : "\\" == o ? p.setAttribute("transform", "translate(-36 -15) rotate(-112.5, 42, 18)") : p.setAttribute("transform", `translate(-3 ${a}) rotate(-90)`),
        u.appendChild(p),
        u.appendChild(r([!1, !1, ["+", "|"].includes(n), !1, !1, ["\\"].includes(o), ["/"].includes(l), !1])),
        u
    }
    ,
    t = function(t, n, r) {
        const o = t.split("\n").map(t=>t.trimEnd().split(""));
        o.shift(),
        o.splice(-1);
        let l = 0;
        const c = o.length;
        for (let e = 0; e < o.length; e++)
            for (let t = 0; t < o[e].length; t++)
                o[e].length > l && (l = o[t].length);
        var u = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        u.setAttribute("width", 30 * l * n),
        u.setAttribute("height", 54 * c * n),
        u.setAttribute("debug", r),
        u.setAttribute("viewBox", `0 0 ${30 * l + 0} ${54 * c + 0}`),
        u.setAttribute("class", "debug");
        var p = document.createElementNS("http://www.w3.org/2000/svg", "style");
        return p.innerHTML = '\n.diagram {\n  display: block;\n}\n\n.diagram line, .diagram circle, .diagram rect {\n  stroke: black;\n}\n\n.diagram line {\n  stroke-width: 2;\n}\n\n.diagram circle {\n  r: 3.5;\n}\n\n.diagram rect {\n  width: 6px;\n  height: 6px;\n}\n\n.diagram text, .glyph, .debug text {\n  /** font-family: Consolas, Monaco, \'Andale Mono\', \'Ubuntu Mono\', monospace; **/\n  font-family: Iosevka Fixed, monospace;\n  font-size: 3em;\n  text-anchor: middle;\n  alignment-baseline: central;\n  white-space: pre;\n}\n\n.reserved {\n  fill: transparent;\n  white-space: pre;\n}\n\n.debug[debug="true"] .reserved {\n  fill: black;\n  opacity: 0.5;\n}\n\n.debug[debug="true"] line.grid {\n  stroke: black;\n  stroke-width: 0.2;\n  stroke-linecap: butt;\n  fill: black;\n  opacity: 1%;\n}\n\npolygon {\n  stroke-width: 0;\n}\n\n.debug[debug="true"] polygon.inner {\n  fill: black;\n  stroke: black;\n  opacity: 5%;\n}\n\npolygon {\n  stroke: black;\n  /** stroke-width: 0.2; **/\n  stroke-linecap: butt;\n  fill: black;\n}\n\n.debug[debug="true"] polygon,\n.debug[debug="true"] line.grid\n{\n  opacity: 10%;\n}\n\n.debug[debug="true"] polygon,\n.debug[debug="true"] path,\n.debug[debug="true"] circle\n{\n  opacity: 50%;\n}\n\n.debug[debug="true"] polygon {\n  fill: red;\n  stroke: red;\n}\n\n/**\ncircle {\n  fill: black;\n}\n**/\n\n.debug[debug="true"] circle,\n.debug[debug="true"] path\n{\n  opacity: 50%;\n  fill: red;\n}\n\n.debug[debug="true"] circle {\n  stroke: red;\n}\n\n.debug[debug="true"] .inner {\n  stroke-width: 0.2;\n}\n\nline.part {\n  stroke-width: 6;\n  stroke-linecap: butt;\n  stroke: black;\n}\n\n.debug[debug="true"] line.part {\n  opacity: 50%;\n  stroke: red;\n}\n\n.debug[debug="true"] line.center {\n  stroke-width: 3;\n  stroke-linecap: butt;\n  opacity: 10%;\n  stroke: black;\n}\n\ntext::selection {\n    fill: black;\n    background-color: #EEE;\n}\n  ',
        u.appendChild(p),
        u.appendChild(function(t) {
            const n = document.createElementNS("http://www.w3.org/2000/svg", "g");
            for (let r = 0; r < t.length; r++)
                for (let o = 0; o < t[r].length; o++) {
                    const l = t[r][o];
                    if (" " == l || '"' == l)
                        continue;
                    let c = e[l];
                    const u = document.createElementNS("http://www.w3.org/2000/svg", "g");
                    let p = !1;
                    for (let e = 0; e < o; e++)
                        '"' == t[r][e] && (p = !p);
                    const a = i(t, [o, r]);
                    if (l.match(/[A-Za-z0-9]/)) {
                        const [,t,,e] = a;
                        p = p || e.match(/[A-Za-uw-z0-9]/) || t.match(/[A-Za-uw-z0-9]/)
                    }
                    c = c && !p,
                    c && u.appendChild(e[l](a)),
                    u.appendChild(s(l, c)),
                    u.setAttribute("transform", `translate(${30 * o} ${54 * r})`),
                    n.appendChild(u)
                }
            return n
        }(o)),
        r && u.appendChild(function(t, e) {
            const n = document.createElementNS("http://www.w3.org/2000/svg", "g")
              , r = document.createElementNS("http://www.w3.org/2000/svg", "line");
            r.setAttribute("x1", 15),
            r.setAttribute("y1", 0),
            r.setAttribute("x2", 15),
            r.setAttribute("y2", 54),
            r.setAttribute("class", "center");
            const s = document.createElementNS("http://www.w3.org/2000/svg", "line");
            s.setAttribute("x1", 0),
            s.setAttribute("y1", 30),
            s.setAttribute("x2", 30),
            s.setAttribute("y2", 54),
            s.setAttribute("class", "center");
            for (let i = 0; i <= 30 * t; i += 3) {
                const t = document.createElementNS("http://www.w3.org/2000/svg", "line");
                t.setAttribute("x1", i),
                t.setAttribute("y1", 0),
                t.setAttribute("x2", i),
                t.setAttribute("y2", 54 * e),
                t.setAttribute("class", "grid"),
                n.appendChild(t)
            }
            for (let i = 0; i <= 54 * e; i += 3) {
                const e = document.createElementNS("http://www.w3.org/2000/svg", "line");
                e.setAttribute("x1", 0),
                e.setAttribute("y1", i),
                e.setAttribute("x2", 30 * t),
                e.setAttribute("y2", i),
                e.setAttribute("class", "grid"),
                n.appendChild(e)
            }
            return n
        }(l, c)),
        u
    }
    ,
    function() {
        for (const e of document.querySelectorAll("script[type='text/tg']")) {
            if (e.hasAttribute("disabled"))
                continue;
            const n = e.innerText
              , r = Number(e.getAttribute("zoom") || .3)
              , s = e.hasAttribute("grid")
              , i = t(n, r, s);
            e.parentNode.insertBefore(i, e.nextSibling)
        }
    }();
}
