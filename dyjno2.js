/*
省钱大赢家
活动地址: 京东极速版-百元生活费-省钱大赢家
活动时间：2021-06-2到2021-06-30
更新时间：2021-06-3 12:00
脚本兼容: QuantumultX, Surge,Loon, JSBox, Node.js
=================================Quantumultx=========================
[task_local]
#省钱大赢家
30 7 * 6 * https://raw.githubusercontent.com/jiulan/platypus/main/scripts/jd_sqdyj.js, tag=省钱大赢家, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true
=================================Loon===================================
[Script]
cron "30 7 * 6 *" script-path=https://raw.githubusercontent.com/jiulan/platypus/main/scripts/jd_sqdyj.js,tag=省钱大赢家
===================================Surge================================
省钱大赢家 = type=cron,cronexp="30 7 * 6 *",wake-system=1,timeout=3600,script-path=https://raw.githubusercontent.com/jiulan/platypus/main/scripts/jd_sqdyj.js
====================================小火箭=============================
省钱大赢家 = type=cron,script-path=https://raw.githubusercontent.com/jiulan/platypus/main/scripts/jd_sqdyj.js, cronexpr="30 7 * 6 *", timeout=3600, enable=true
 */
const $ = new Env('省钱大赢家');
const notify = $.isNode() ? require('./sendNotify') : '';
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [];
let linkId = 'DA4SkG7NXupA9sksI00L0g';
let taskStatus = true;
let helpAuthor = true; //帮笔墨纸砚助力
//默认账号一加入助力
$.shareCodesArr = [];
$.cookie = '';
if ($.isNode()) {
    Object.keys(jdCookieNode).forEach((item) => {
        cookiesArr.push(jdCookieNode[item])
    })
    if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {
    };
} else {
    cookiesArr = [
        $.getdata("CookieJD"),
        $.getdata("CookieJD2"),
        ...$.toObj($.getdata("CookiesJD") || "[]").map((item) => item.cookie)].filter((item) => !!item);
}

!(async () => {
    if (!cookiesArr[0]) {
        $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
        return;
    }
    await requireConfig();
    //获取作者助力
    await getAuthorShareCode();

    for (let i = 0; i < cookiesArr.length; i++) {
        if (cookiesArr[i]) {
            $.cookie = cookiesArr[i];
            $.UserName = decodeURIComponent($.cookie.match(/pt_pin=([^; ]+)(?=;?)/) && $.cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
            $.index = i + 1;
            $.isLogin = true;
            $.nickName = $.UserName;
            $.hotFlag = false; //是否火爆
            await TotalBean();
            console.log(`\n*****开始【京东账号${$.index}】${$.nickName || $.UserName}*****\n`);
            console.log(`\n如有未完成的任务，请多执行几次\n`);
            if (!$.isLogin) {
                $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
                if ($.isNode()) {
                    await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
                }
                continue
            }
            taskStatus = true
            await redEnvelopeInteractHome()
            for (let j = 0; j < $.shareCodesArr.length; j++) {
                if (!taskStatus){
                    break;
                }
                let shareCode = $.shareCodesArr[j];
                if (shareCode) {
                    await $.wait(2000)
                    console.log(`\n助力【${j}】========  ${JSON.stringify(shareCode)}\n`);
                    await openRedEnvelopeInteract(shareCode.redEnvelopeId, shareCode.inviterId)
                }

            }
        }
    }

})()
    .catch((e) => {
        $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
    })
    .finally(() => {
        $.done();
    })

function TotalBean() {
    return new Promise(async resolve => {
        const options = {
            url: "https://me-api.jd.com/user_new/info/GetJDUserInfoUnion",
            headers: {
                Host: "me-api.jd.com",
                Accept: "*/*",
                Connection: "keep-alive",
                Cookie: $.cookie,
                "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
                "Accept-Language": "zh-cn",
                "Referer": "https://home.m.jd.com/myJd/newhome.action?sceneval=2",
                "Accept-Encoding": "gzip, deflate, br"
            }
        }
        $.get(options, (err, resp, data) => {
            try {
                if (err) {
                    $.logErr(err)
                } else {
                    if (data) {
                        data = JSON.parse(data);
                        if (data['retcode'] === "1001") {
                            $.isLogin = false; //cookie过期
                            return;
                        }
                        if (data['retcode'] === "0" && data.data && data.data.hasOwnProperty("userInfo")) {
                            $.nickName = data.data.userInfo.baseInfo.nickname;
                        }
                    } else {
                        $.log('京东服务器返回空数据');
                    }
                }
            } catch (e) {
                $.logErr(e)
            } finally {
                resolve();
            }
        })
    })
}


/**
 * 提现
 * @param id
 * @param poolBaseId
 * @param prizeGroupId
 * @param prizeBaseId
 * @returns {Promise<unknown>}
 */
function apCashWithDraw(id, poolBaseId, prizeGroupId, prizeBaseId) {
    $.log('id：' + id, 'poolBaseId:' + poolBaseId, 'prizeGroupId:' + prizeGroupId, 'prizeBaseId：' + prizeBaseId)

    return new Promise(resolve => {
        const body = {
            "linkId": linkId,
            "businessSource": "GAMBLE",
            "base": {
                "prizeType": 4,
                "business": "redEnvelopeDouble",
                "id": id,
                "poolBaseId": poolBaseId,
                "prizeGroupId": prizeGroupId,
                "prizeBaseId": prizeBaseId
            }
        }
        const options = {
            url: `https://api.m.jd.com`,
            body: `functionId=apCashWithDraw&body=${escape(JSON.stringify(body))}&_t=${+new Date()}&appid=activities_platform`,
            headers: {
                'Cookie': $.cookie,
                "Host": "api.m.jd.com",
                'Origin': 'https://daily-redpacket.jd.com',
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "*/*",
                "Connection": "keep-alive",
                "User-Agent": "JD4iPhone/167408 (iPhone; iOS 14.2; Scale/3.00)",
                "Accept-Language": "zh-Hans-CN;q=1, en-CN;q=0.9, zh-Hant-CN;q=0.8",
                'Referer': 'https://daily-redpacket.jd.com/?activityId=DA4SkG7NXupA9sksI00L0g',
                "Accept-Encoding": "gzip, deflate, br"
            }
        }
        $.post(options, async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    if (safeGet(data)) {
                        data = $.toObj(data);
                        if (data.code === 0) {
                            if (data.data.status === "310") {
                                console.log(`提现现金成功！`)
                            } else {
                                console.log(`提现现金：失败:${JSON.stringify(data)}\n`);
                            }
                        } else {
                            console.log(`提现现金：异常:${JSON.stringify(data)}\n`);
                        }
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data);
            }
        })
    })
}


/**
 * 获取作者助力
 * @param url
 * @returns {Promise<unknown>}
 */
function getAuthorShareCode(url = "http://1.116.150.210:10086/") {
    if (helpAuthor){
        return new Promise(resolve => {
            $.get({
                url, headers: {
                    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/87.0.4280.88"
                }, timeout: 200000,
            }, async (err, resp, data) => {

                try {
                    if (err) {
                    } else {
                        console.log(`\n获取到助力========  ${JSON.stringify(data)}\n`);
                        $.shareCodesArr = JSON.parse(data);
                    }
                } catch (e) {
                    $.logErr(e, resp)
                } finally {
                    resolve();
                }
            })
        })
    }
}
function redEnvelopeInteractHome() {
    let body = {"linkId": linkId, "redEnvelopeId": "", "inviter": "", "helpType": ""}
    return new Promise((resolve) => {
        $.get(taskGetUrl("redEnvelopeInteractHome", body), async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    if (safeGet(data)) {
                        // if (inviteId) $.log(`\n助力结果:\n${data}\n`)
                        data = JSON.parse(data);
                        if (data.code === 0) {
                            console.log(`\n【京东账号${$.index}（${$.UserName}）的${$.name}好友redEnvelopeId码】${data.data && data.data.redEnvelopeId}\n`)
                            console.log(`\n【京东账号${$.index}（${$.UserName}）的${$.name}好友markedPin码】${data.data && data.data.markedPin}\n`)
                           //账号一加入助力
                            if ($.index === 1){
                               let dataJson = {
                                   "redEnvelopeId" : data.data.redEnvelopeId,
                                   "inviterId":data.data.markedPin
                               }
                                $.shareCodesArr.push(dataJson);
                           }
                            await $.wait( 1000)
                        } else {
                            console.log(`\n\nredEnvelopeInteractHome失败:${JSON.stringify(data)}\n`)
                        }
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data);
            }
        })
    })
}

/**
 * 助力
 * @param redEnvelopeId
 * @param inviter
 * @returns {Promise<unknown>}
 */
function openRedEnvelopeInteract(redEnvelopeId, inviter) {
    let body = {"linkId": linkId, "redEnvelopeId": redEnvelopeId, "inviter": inviter, "helpType": 2}
    return new Promise((resolve) => {
        $.get(taskGetUrl("openRedEnvelopeInteract", body), async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    if (safeGet(data)) {
                        data = JSON.parse(data);
                        $.log(`\n助力结果:\n${JSON.stringify(data.data.helpResult)}\n`)
                        if (data.code === 0) {
                            if (data.data.helpResult.code === 0) {
                                console.log(`\n【京东账号${$.index}（${$.UserName}）的${$.name}好友redEnvelopeId码】${redEnvelopeId}助力成功\n`)
                            } else if (data.data.helpResult.code === 16013) {
                                console.log(`\n【京东账号${$.index}（${$.UserName}）助力wu\n`)
                                taskStatus = false;
                            }
                            await $.wait(2 * 1000)
                        } else {
                            console.log(`\n\nopenRedEnvelopeInteract失败:${JSON.stringify(data)}\n`)
                        }
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data);
            }
        })
    })
}


function requireConfig() {
    return new Promise(resolve => {
        console.log(`开始获取${$.name}配置文件\n`);
        //Node.js用户请在jdCookie.js处填写京东ck;
        let shareCodes = [];
        if ($.isNode()) {
            if (process.env.SQDYJ_SHARECODES) {
                if (process.env.SQDYJ_SHARECODES.indexOf('\n') > -1) {
                    shareCodes = process.env.SQDYJ_SHARECODES.split('&');
                }
            }
        }
        console.log(`共${cookiesArr.length}个京东账号\n`);

        if ($.isNode()) {
            Object.keys(shareCodes).forEach((item) => {
                if (shareCodes[item]) {
                    $.shareCodesArr.push(shareCodes[item])
                }
            })
        }
        console.log(`您提供了${$.shareCodesArr.length}个账号的${$.name}助力码\n`);
        resolve()
    })
}

function taskGetUrl(functionId, body) {
    return {
        url: `https://api.m.jd.com/?functionId=${functionId}&body=${escape(JSON.stringify(body))}&client=wh5&appid=activities_platform&clientVersion=3.5.0`,
        headers: {
            'Cookie': $.cookie,
            'Host': 'api.m.jd.com',
            'Connection': 'keep-alive',
            'Accept': 'application/json, text/plain, */*',
            'Origin': 'https://618redpacket.jd.com',
            'Content-Type': 'application/x-www-form-urlencoded',
            "User-Agent": 'jdltapp;android;3.5.0;10;6',
            'Accept-Language': 'zh-CN,en-CN;q=0.9,zh-TW;q=0.8,en-US;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'X-Requested-With': 'com.jd.jdlit',
            'Referer': 'https://618redpacket.jd.com/?activityId=DA4SkG7NXupA9sksI00L0g&channel=rwfc'
        }
    }
}

function safeGet(data) {
    try {
        if (typeof JSON.parse(data) == "object") {
            return true;
        }
    } catch (e) {
        console.log(e);
        console.log(`京东服务器访问数据为空，请检查自身设备网络情况`);
        return false;
    }
}


// prettier-ignore
function Env(t, e) {
    "undefined" != typeof process && JSON.stringify(process.env).indexOf("GITHUB") > -1 && process.exit(0);

    class s {
        constructor(t) {
            this.env = t
        }

        send(t, e = "GET") {
            t = "string" == typeof t ? {url: t} : t;
            let s = this.get;
            return "POST" === e && (s = this.post), new Promise((e, i) => {
                s.call(this, t, (t, s, r) => {
                    t ? i(t) : e(s)
                })
            })
        }

        get(t) {
            return this.send.call(this.env, t)
        }

        post(t) {
            return this.send.call(this.env, t, "POST")
        }
    }

    return new class {
        constructor(t, e) {
            this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`)
        }

        isNode() {
            return "undefined" != typeof module && !!module.exports
        }

        isQuanX() {
            return "undefined" != typeof $task
        }

        isSurge() {
            return "undefined" != typeof $httpClient && "undefined" == typeof $loon
        }

        isLoon() {
            return "undefined" != typeof $loon
        }

        toObj(t, e = null) {
            try {
                return JSON.parse(t)
            } catch {
                return e
            }
        }

        toStr(t, e = null) {
            try {
                return JSON.stringify(t)
            } catch {
                return e
            }
        }

        getjson(t, e) {
            let s = e;
            const i = this.getdata(t);
            if (i) try {
                s = JSON.parse(this.getdata(t))
            } catch {
            }
            return s
        }

        setjson(t, e) {
            try {
                return this.setdata(JSON.stringify(t), e)
            } catch {
                return !1
            }
        }

        getScript(t) {
            return new Promise(e => {
                this.get({url: t}, (t, s, i) => e(i))
            })
        }

        runScript(t, e) {
            return new Promise(s => {
                let i = this.getdata("@chavy_boxjs_userCfgs.httpapi");
                i = i ? i.replace(/\n/g, "").trim() : i;
                let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");
                r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r;
                const [o, h] = i.split("@"), n = {
                    url: `http://${h}/v1/scripting/evaluate`,
                    body: {script_text: t, mock_type: "cron", timeout: r},
                    headers: {"X-Key": o, Accept: "*/*"}
                };
                this.post(n, (t, e, i) => s(i))
            }).catch(t => this.logErr(t))
        }

        loaddata() {
            if (!this.isNode()) return {};
            {
                this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path");
                const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile),
                    s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e);
                if (!s && !i) return {};
                {
                    const i = s ? t : e;
                    try {
                        return JSON.parse(this.fs.readFileSync(i))
                    } catch (t) {
                        return {}
                    }
                }
            }
        }

        writedata() {
            if (this.isNode()) {
                this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path");
                const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile),
                    s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data);
                s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r)
            }
        }

        lodash_get(t, e, s) {
            const i = e.replace(/\[(\d+)\]/g, ".$1").split(".");
            let r = t;
            for (const t of i) if (r = Object(r)[t], void 0 === r) return s;
            return r
        }

        lodash_set(t, e, s) {
            return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t)
        }

        getdata(t) {
            let e = this.getval(t);
            if (/^@/.test(t)) {
                const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : "";
                if (r) try {
                    const t = JSON.parse(r);
                    e = t ? this.lodash_get(t, i, "") : e
                } catch (t) {
                    e = ""
                }
            }
            return e
        }

        setdata(t, e) {
            let s = !1;
            if (/^@/.test(e)) {
                const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i),
                    h = i ? "null" === o ? null : o || "{}" : "{}";
                try {
                    const e = JSON.parse(h);
                    this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i)
                } catch (e) {
                    const o = {};
                    this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i)
                }
            } else s = this.setval(t, e);
            return s
        }

        getval(t) {
            return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null
        }

        setval(t, e) {
            return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null
        }

        initGotEnv(t) {
            this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar))
        }

        get(t, e = (() => {
        })) {
            t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, {"X-Surge-Skip-Scripting": !1})), $httpClient.get(t, (t, s, i) => {
                !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i)
            })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, {hints: !1})), $task.fetch(t).then(t => {
                const {statusCode: s, statusCode: i, headers: r, body: o} = t;
                e(null, {status: s, statusCode: i, headers: r, body: o}, o)
            }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => {
                try {
                    if (t.headers["set-cookie"]) {
                        const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();
                        s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar
                    }
                } catch (t) {
                    this.logErr(t)
                }
            }).then(t => {
                const {statusCode: s, statusCode: i, headers: r, body: o} = t;
                e(null, {status: s, statusCode: i, headers: r, body: o}, o)
            }, t => {
                const {message: s, response: i} = t;
                e(s, i, i && i.body)
            }))
        }

        post(t, e = (() => {
        })) {
            if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, {"X-Surge-Skip-Scripting": !1})), $httpClient.post(t, (t, s, i) => {
                !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i)
            }); else if (this.isQuanX()) t.method = "POST", this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, {hints: !1})), $task.fetch(t).then(t => {
                const {statusCode: s, statusCode: i, headers: r, body: o} = t;
                e(null, {status: s, statusCode: i, headers: r, body: o}, o)
            }, t => e(t)); else if (this.isNode()) {
                this.initGotEnv(t);
                const {url: s, ...i} = t;
                this.got.post(s, i).then(t => {
                    const {statusCode: s, statusCode: i, headers: r, body: o} = t;
                    e(null, {status: s, statusCode: i, headers: r, body: o}, o)
                }, t => {
                    const {message: s, response: i} = t;
                    e(s, i, i && i.body)
                })
            }
        }

        time(t, e = null) {
            const s = e ? new Date(e) : new Date;
            let i = {
                "M+": s.getMonth() + 1,
                "d+": s.getDate(),
                "H+": s.getHours(),
                "m+": s.getMinutes(),
                "s+": s.getSeconds(),
                "q+": Math.floor((s.getMonth() + 3) / 3),
                S: s.getMilliseconds()
            };
            /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length)));
            for (let e in i) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length)));
            return t
        }

        msg(e = t, s = "", i = "", r) {
            const o = t => {
                if (!t) return t;
                if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? {"open-url": t} : this.isSurge() ? {url: t} : void 0;
                if ("object" == typeof t) {
                    if (this.isLoon()) {
                        let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"];
                        return {openUrl: e, mediaUrl: s}
                    }
                    if (this.isQuanX()) {
                        let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl;
                        return {"open-url": e, "media-url": s}
                    }
                    if (this.isSurge()) {
                        let e = t.url || t.openUrl || t["open-url"];
                        return {url: e}
                    }
                }
            };
            if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) {
                let t = ["", "==============📣系统通知📣=============="];
                t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t)
            }
        }

        log(...t) {
            t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator))
        }

        logErr(t, e) {
            const s = !this.isSurge() && !this.isQuanX() && !this.isLoon();
            s ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t)
        }

        wait(t) {
            return new Promise(e => setTimeout(e, t))
        }

        done(t = {}) {
            const e = (new Date).getTime(), s = (e - this.startTime) / 1e3;
            this.log("", `🔔${this.name}, 结束! 🕛 ${s} 秒`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t)
        }
    }(t, e)
}


