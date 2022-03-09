const $ = new Env('五店组队分豆');
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';

let cookiesArr = [],cookie = '';

if ($.isNode()) {
    Object.keys(jdCookieNode).forEach((item) => {
        cookiesArr.push(jdCookieNode[item])
    })
}

!(async () => {
    if (!cookiesArr[0]) {
        $.msg($.name, '【提示】请先获取cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', {
            "open-url": "https://bean.m.jd.com/"
        });
        return;
    }


    //活动ID 
    if (process.env.jd_zdjr_activityId)
        activityId = process.env.jd_zdjr_activityId;
    $.ShareNum = 0;
    $.s_user = 0;
    $.inviter = 'at88ou9rb+CbYoub4WUZJFhXBmEZA6lSVT+72G8p/fVoLg2u1PPhDKnKIGiyllSk';
    $.activityUrl = `https://cjhydz-isv.isvjcloud.com/microDz/invite/activity/wx/view/index/${random(1000000, 9999999)}?activityId=${$.activityId}&inviter=${$.inviter}`
    console.log(`活动地址：${$.activityUrl}`)
    for (let i = 10; i < cookiesArr.length; i++) {
        if (cookiesArr[i]) {
            cookie = cookiesArr[i];
            $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1])
            $.index = i + 1;
            $.isLogin = true;
            await checkCookie();
            console.log(`\n\n*********开始【京东账号${$.index}】${$.UserName}*********`);
            if (!$.isLogin) {
                $.log(`cookie已失效`);
                continue
            }
            $.ADID = getUUID('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 1);
            $.UUID = getUUID('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
            $.activityUrl = `https://cjhydz-isv.isvjcloud.com/microDz/invite/activity/wx/view/index/${random(1000000, 9999999)}?activityId=${$.activityId}&inviter=${$.inviter}`
            await run();
            console.log(`当前${$.inviter}成功邀请了${$.s_user}个用户`)
            if ($.s_user >= $.teams * 5 || $.activityHasEnd) {
                break
            }
        }
    }
})()
.catch((e) => $.logErr(e))
    .finally(() => $.done())

async function run() {
    try {
        $.Token = '';
        $.Pin = '';
        $.time = 0;
        await takePostRequest(`isvObfuscator`);
        if ($.Token === '') {
            console.log('获取[token]失败！');
            await $.wait(2000);
            return
        }

        await accessActivity();
        await takePostRequest(`getMyPing`);
        if ($.Pin === '') {
            console.log("获取[Pin]失败！")
            await $.wait(2000);
            return
        }

        if (!$.checkOpenCardData) {
            console.log(`开始获取开卡列表信息`)
            await takePostRequest(`getActivityInfo`);
            if ($.activityHasEnd) return;
        }
        await takePostRequest(`accessLog`);
        await takePostRequest(`acceptInvite`);

        if ($.message.indexOf('成功') > -1) {
            console.log('接受邀请成功')
            for (let venderId of $.checkOpenCardData.split(',')) {
                console.log(`入会 venderId:${venderId}`);
                await join(venderId);
                await $.wait(500);
            }
            do {
                await accessActivity();
                await $.wait(2000);
                await takePostRequest(`getOpenCardAllStatuesNew`);
                if ($.time >= 20)
                {
                    $.time = 0;
                    await takePostRequest(`getActivityInfo`);
                }
            } while ($.time);
        } else {
            console.log($.message)
            await $.wait(2000);
        }
    } catch (e) {
        console.log(e)
    }
}

function accessActivity() {
    return new Promise(resolve => {
        let options = {
            url: `${$.activityUrl}`,
            headers: {
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'User-Agent': `jdapp;iPhone;9.5.4;13.6;${$.UUID};network/wifi;ADID/${$.ADID};model/iPhone10,3;addressid/0;appBuild/167668;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 13_6 like Mac OS X)`,
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest',
                'Host': 'cjhydz-isv.isvjcloud.com',
                "Referer": $.activityUrl,
            },
            timeout: 30000
        }
        $.get(options, async (err, resp, data) => {
            try {
                if (err) {
                    if (err.indexOf('493')) {
                        console.log('code:493,当前IP风控稍等5分钟再次测试');
                        await $.wait(1000 * 60 * 5);
                        await accessActivity();
                        return;
                    }
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} accessActivity API请求失败，请检查网路重试`)
                } else {
                    let LZ_TOKEN_KEY = ''
                    let LZ_TOKEN_VALUE = ''
                    let setcookies = resp['headers']['set-cookie'] || resp['headers']['Set-Cookie'] || ''
                    let setcookie = ''
                    if (setcookies) {
                        if (typeof setcookies != 'object') {
                            setcookie = setcookies.split(',')
                        } else setcookie = setcookies
                        for (let ck of setcookie) {
                            let name = ck.split(";")[0].trim()
                            if (name.split("=")[1]) {
                                if (name.indexOf('LZ_TOKEN_KEY=') > -1) LZ_TOKEN_KEY = name.replace(/ /g, '') + ';'
                                if (name.indexOf('LZ_TOKEN_VALUE=') > -1) LZ_TOKEN_VALUE = name.replace(/ /g, '') + ';'
                            }
                        }
                    }
                    if (LZ_TOKEN_KEY && LZ_TOKEN_VALUE) $.activityCookie = `${LZ_TOKEN_KEY} ${LZ_TOKEN_VALUE}`
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}

function join(venderId) {
    return new Promise(resolve => {
        let options = {
            url: 'https://api.m.jd.com/client.action?appid=jd_shop_member&functionId=bindWithVender&body={"venderId":"' + venderId + '\",\"shopId\":\"' + venderId + '","bindByVerifyCodeFlag":1,"registerExtend":{"v_sex":"未知","v_name":"大品牌","v_birthday":"2020-05-20"},"writeChildFlag":0,"activityId":1454199,"channel":401}&client=H5&clientVersion=9.2.0&uuid=88888&jsonp=jsonp_1627049995456_46808',
            headers: {
                'Content-Type': 'text/plain; Charset=UTF-8',
                'Origin': 'https://api.m.jd.com',
                'Host': 'api.m.jd.com',
                'accept': '*/*',
                'User-Agent': `jdapp;iPhone;9.5.4;13.6;${$.UUID};network/wifi;ADID/${$.ADID};model/iPhone10,3;addressid/0;appBuild/167668;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 13_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1`,
                'content-type': 'application/x-www-form-urlencoded',
                'Referer': 'https://shopmember.m.jd.com/shopcard/?venderId=' + venderId + '&shopId=' + venderId + '&venderType=1&channel=102&returnUrl=https%%3A%%2F%%2Flzdz1-isv.isvjcloud.com%%2Fdingzhi%%2Fdz%%2FopenCard%%2Factivity%%2F7376465%%3FactivityId%%3Dd91d932b9a3d42b9ab77dd1d5e783839%%26',
                'Cookie': cookie
            }
        }
        $.get(options, async (err, resp, data) => {
            try {
                data = data.match(/(\{().+\})/)[1]
                data = JSON.parse(data);
                if (data.success == true) {
                    $.log(data.message)
                } else if (data.success == false) {
                    $.log(data.message)
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data);
            }
        })
    })
}

async function takePostRequest(type) {
    let url = 'https://cjhydz-isv.isvjcloud.com';
    let body = '';
    let method = 'POST'
    switch (type) {
        case 'isvObfuscator':
            url = `https://api.m.jd.com/client.action?functionId=isvObfuscator&clientVersion=10.0.4&build=88641&client=android&d_brand=OPPO&d_model=PCAM00&osVersion=10&screen=2208*1080&partner=oppo&oaid=&openudid=7049442d7e415232&eid=eidAfb0d81231cs3I4yd3GgLRjqcx9qFEcJEmyOMn1BwD8wvLt/pM7ENipVIQXuRiDyQ0FYw2aud9+AhtGqo1Zhp0TsLEgoKZvAWkaXhApgim9hlEyRB&sdkVersion=29&lang=zh_CN&uuid=7049442d7e415232&aid=7049442d7e415232&area=4_48201_54794_0&networkType=wifi&wifiBssid=774de7601b5cddf9aad1ae30f3a3dfc0&uts=zrHR4oLv7fO8bj08KaWkuJrGiAm%2FG6al3p01S3QPkHjEe70KB7DMBdz3cfE%2BRhrQIyj%2B2Jj2QqzA%2BpAdyk9V1ui51eL%2FoBnDH0kFw%2FNynmvOvct2RwpCzR7s0IfLFlCdif1pPkN560QPhIQm8X6wiYfI7PKqHbiI&uemps=0-0&st=1627949552040&sign=545fe280a8a65be83421dc76b0dc0cc8&sv=112`;
            body = `body=%7B%22id%22%3A%22%22%2C%22url%22%3A%22https%3A%2F%2Fcjhydz-isv.isvjcloud.com%22%7D`;
            break;
        case 'getMyPing':
            url = url + '/customer/getMyPing';
            body = `userId=599119&token=${encodeURIComponent($.Token)}&fromType=APP&riskType=1`;
            break;
        case 'getActivityInfo':
            url = url + '/microDz/invite/activity/wx/getActivityInfo';
            body = `activityId=${$.activityId}`
            break;
        case 'accessLog':
            url = url + '/common/accessLog';
            body = `venderId=0&code=99&pin=${encodeURIComponent($.Pin)}&activityId=${$.activityId}&pageUrl=${$.activityUrl}`
            break;
        case 'acceptInvite':
            url = url + '/microDz/invite/activity/wx/acceptInvite';
            let inviterNick = "***"
            let inviterImg = "https%3A%2F%2Fimg10.360buyimg.com%2Fimgzone%2Fjfs%2Ft1%2F7020%2F27%2F13511%2F6142%2F5c5138d8E4df2e764%2F5a1216a3a5043c5d.png"
            body = `activityId=${$.activityId}&inviter=${$.inviter}&inviterImg=${inviterImg}&inviterNick=${encodeURIComponent(inviterNick)}&invitee=${encodeURIComponent($.Pin)}&inviteeImg=https%3A%2F%2Fimg10.360buyimg.com%2Fimgzone%2Fjfs%2Ft1%2F7020%2F27%2F13511%2F6142%2F5c5138d8E4df2e764%2F5a1216a3a5043c5d.png&inviteeNick=${encodeURIComponent($.UserName)}`
            break;
        case 'getOpenCardAllStatuesNew':
            url = url + '/microDz/invite/activity/wx/getOpenCardAllStatuesNew';
            body = `activityId=${$.activityId}&pin=${encodeURIComponent($.Pin)}&isInvited=1`
            break;
        default:
            console.log(`错误${type}`);
    }
    let options = getPostRequest(url, body, method);
    return new Promise(async resolve => {
        $.post(options, (err, resp, data) => {
            try {
                if (err) {
                    if (resp && resp.statusCode && resp.statusCode == 493) {
                        console.log('此ip已被限制，请过10分钟后再执行脚本\n');
                    }
                    console.log(`${$.toStr(err,err)}`);
                    console.log(`${type} API请求失败，请检查网路重试`);
                } else {
                    if (type != 'accessActivity') {
                        dealReturn(type, data);
                    } else {
                        dealReturn(type, resp);
                    }

                }
            } catch (e) {
                console.log(e, resp);
            } finally {
                resolve();
            }
        });
    });
}

async function dealReturn(type, data) {
    let res = '';
    try {
        if (type != 'accessLog') {
            if (data) {
                res = $.toObj(data)
            }
        }
    } catch (e) {
        console.log(`${type} 执行任务异常`);
        console.log(data);
        $.runFalag = false;
    }

    try {
        switch (type) {
            case 'isvObfuscator':
                if (typeof res == 'object' && res.errcode == 0) {
                    if (typeof res.token != 'undefined') $.Token = res.token;
                } else if (typeof res == 'object' && res.message) {
                    console.log(`${type} ${res.message || ''}`);
                } else {
                    console.log(data);
                }
                break;
            case 'accessLog':
                break;
            case 'getMyPing':
            case 'getActivityInfo':
            case 'acceptInvite':
                if (typeof res == 'object') {
                    if (type == 'getMyPing') {
                        if (res.result == true) {
                            if (typeof res.data.secretPin != 'undefined') $.Pin = res.data.secretPin || '';
                        }
                    } else if (type == 'getActivityInfo') {
                        // console.log(JSON.stringify(res.data))
                        $.teams = res.data.actRule.match(/可组队(.+?)次/) && res.data.actRule.match(/可组队(.+?)次/)[1]
                        console.log(`可组队${$.teams}次，豆池剩余${res.data.residualPercentage}%`)
                        if (res.result == true) {
                            if (res.data.residualPercentage == 0) {
                                $.log(`活动已经结束`);
                                $.activityHasEnd = true;
                            }
                            if (typeof res.data.venderIds != 'undefined') $.checkOpenCardData = res.data.venderIds || 0;
                        }
                    } else if (type == 'acceptInvite') {
                        $.message = res.errorMessage || "";
                    }
                } else if (res.msg) {
                    $.log(`${type}:${res.msg || ''}`);
                } else if (res.errorMessage) {
                    $.log(`${type}:${res.errorMessage || ''}`);
                } else {
                    $.log(`${type}:${data}`);
                }
                break;
            case 'getOpenCardAllStatuesNew':
                if (typeof res == 'object') {
                    $.time++;
                    console.log(`第${$.time}次尝试${res.data.reward !=0 ? '成功' : '失败'},reward为${res.data.reward}`);
                    console.log('isCanJoin: ' + res.data.isCanJoin + ",reward:" + res.data.reward);
                    if (res.data.reward != 0) {
                        $.time = 0;
                        $.s_user++;
                    }
                } else {
                    console.log("getOpenCardAllStatuesNew，当前返回为空。等待5秒再次尝试")
                    await accessActivity();
                    await $.wait(5000);
                }
                break;
            default:
                console.log(`${type}-> ${data}`);
                if (typeof res == 'object') {
                    if (res.errorMessage) {
                        if (res.errorMessage.indexOf('火爆') > -1) {
                            $.hotFlag = true;
                        }
                    }
                }
        }
    } catch (e) {
        console.log(e);
    }
}

function getPostRequest(url, body, method = "POST") {
    let headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-cn",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        'Content-Type': "application/x-www-form-urlencoded",
        'Cookie': cookie,
        'User-Agent': `jdapp;iPhone;9.5.4;13.6;${$.UUID};network/wifi;ADID/${$.ADID};model/iPhone10,3;addressid/0;appBuild/167668;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 13_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1`,
        "X-Requested-With": "XMLHttpRequest",
    };

    if (url.indexOf('https://cjhydz-isv.isvjcloud.com') > -1) {
        headers["Referer"] = 'https://cjhydz-isv.isvjcloud.com';
        headers[`Cookie`] = `${cookie} ${$.activityCookie} ${$.Pin && "AUTH_C_USER=" + $.Pin + ";" || ""}`;
    }
    return {url: url,method: method,headers: headers,body: body,timeout: 30000};
}

async function getAuthorShareCode(url) {
    return new Promise(resolve => {
        const options = {
            url: `${url}?${new Date()}`,
            "timeout": 10000,
            headers: {
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/87.0.4280.88"
            }
        };
        $.get(options, async (err, resp, data) => {
            try {
                if (err) {} else {
                    if (data) data = JSON.parse(data)
                }
            } catch (e) {
                // $.logErr(e, resp)
            } finally {
                resolve(data);
            }
        })
    })
}

function checkCookie() {
    const options = {
        url: "https://me-api.jd.com/user_new/info/GetJDUserInfoUnion",
        headers: {
            "Host": "me-api.jd.com",
            "Accept": "*/*",
            "Connection": "keep-alive",
            "Cookie": cookie,
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.2 Mobile/15E148 Safari/604.1",
            "Accept-Language": "zh-cn",
            "Referer": "https://home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&",
            "Accept-Encoding": "gzip, deflate, br",
        }
    };
    return new Promise(resolve => {
        $.get(options, (err, resp, data) => {
            try {
                if (err) {
                    $.logErr(err)
                } else {
                    if (data) {
                        data = JSON.parse(data);
                        if (data.retcode === "1001") {
                            $.isLogin = false; //cookie过期
                            return;
                        }
                        if (data.retcode === "0" && data.data.hasOwnProperty("userInfo")) {
                            $.nickName = data.data.userInfo.baseInfo.nickname;
                        }
                    } else {
                        $.log('京东返回了空数据');
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

function random(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function getUUID(format = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', UpperCase = 0) {
    return format.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        if (UpperCase) {
            uuid = v.toString(36).toUpperCase();
        } else {
            uuid = v.toString(36)
        }
        return uuid;
    });
}

// prettier-ignore
function Env(t,e){"undefined"!=typeof process&&JSON.stringify(process.env).indexOf("GITHUB")>-1&&process.exit(0);class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),n={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`❗️${this.name}, 错误!`,t.stack):this.log("",`❗️${this.name}, 错误!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}