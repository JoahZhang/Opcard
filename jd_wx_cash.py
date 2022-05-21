#!/bin/env python3
# -*- coding: utf-8 -*

# cron 1 7 0 * * *
# export wxcash_pins=["pt_pin1","pt_pin2"]

from urllib.parse import unquote, quote
import time, datetime, os, sys
import requests, json, re, random
import threading,math


UserAgent = ''
script_name = '微信领现金助力'

def printT(msg):
    print("[{}]: {}".format(datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"), msg))
    sys.stdout.flush()

def delEnvs(label):
    try:
        if label == 'True' or label == 'yes' or label == 'true' or label == 'Yes':
            return True
        elif label == 'False' or label == 'no' or label == 'false' or label == 'No':
            return False
    except:
        pass
    try:
        if '.' in label:
            return float(label)
        elif '&' in label:
            return label.split('&')
        elif '@' in label:
            return label.split('@')
        else:
            return int(label)
    except:
        return label

class getJDCookie():
    # 适配青龙平台环境ck
    def getckfile(self):
        ql_new = '/ql/config/env.sh'
        ql_old = '/ql/config/cookie.sh'
        if os.path.exists(ql_new):
            printT("当前环境青龙面板新版")
            return ql_new
        elif os.path.exists(ql_old):
            printT("当前环境青龙面板旧版")
            return ql_old

    # 获取cookie
    def getallCookie(self):
        cookies = ''
        ckfile = self.getckfile()
        try:
            if os.path.exists(ckfile):
                with open(ckfile, "r", encoding="utf-8") as f:
                    cks_text = f.read()
                if 'pt_key=' in cks_text and 'pt_pin=' in cks_text:
                    r = re.compile(r"pt_key=.*?pt_pin=.*?;", re.M | re.S | re.I)
                    cks_list = r.findall(cks_text)
                    if len(cks_list) > 0:
                        for ck in cks_list:
                            cookies += ck
            return cookies
        except Exception as e:
            printT(f"【getCookie Error】{e}")

    # 检测cookie格式是否正确
    def getUserInfo(self, ck, user_order, pinName):
        url = 'https://me-api.jd.com/user_new/info/GetJDUserInfoUnion?orgFlag=JD_PinGou_New&callSource=mainorder&channel=4&isHomewhite=0&sceneval=2&sceneval=2&callback='
        headers = {
            'Cookie': ck,
            'Accept': '*/*',
            'Connection': 'close',
            'Referer': 'https://home.m.jd.com/myJd/home.action',
            'Accept-Encoding': 'gzip, deflate, br',
            'Host': 'me-api.jd.com',
            'User-Agent': Ua(),
            'Accept-Language': 'zh-cn'
        }
        try:
            resp = requests.get(url=url, headers=headers, timeout=60).json()
            if resp['retcode'] == "0":
                nickname = resp['data']['userInfo']['baseInfo']['nickname']
                return ck, nickname
            else:
                context = f"账号{user_order}【{pinName}】Cookie 已失效！请重新获取。"
                print(context)
                return ck, False
        except Exception:
            context = f"账号{user_order}【{pinName}】Cookie 已失效！请重新获取。"
            print(context)
            return ck, False

    def getcookies(self):
        """
        :return: cookiesList,userNameList,pinNameList
        """
        cookiesList = []
        pinNameList = []
        nickNameList = []
        cookies = self.getallCookie()
        if 'pt_key=' in cookies and 'pt_pin=' in cookies:
            r = re.compile(r"pt_key=.*?pt_pin=.*?;", re.M | re.S | re.I)
            result = r.findall(cookies)
            if len(result) >= 1:
                printT("您已配置{}个账号".format(len(result)))
                user_order = 1
                for ck in result:
                    r = re.compile(r"pt_pin=(.*?);")
                    pinName = r.findall(ck)
                    pinName = unquote(pinName[0])
                    # 获取账号名
                    cookiesList.append(ck)
                    pinNameList.append(pinName)
                    # ck, nickname = self.getUserInfo(ck, user_order, pinName)
                    # if nickname != False:
                    #     cookiesList.append(ck)
                    #     pinNameList.append(pinName)
                    #     nickNameList.append(nickname)
                    #     user_order += 1
                    # else:
                    #     user_order += 1
                    #     continue
                if len(cookiesList) > 0:
                    return cookiesList, pinNameList
                else:
                    printT("没有可用Cookie，已退出")
                    exit(4)
        else:
            printT("没有可用Cookie，已退出")
            exit(4)

def getPinEnvs():
    if "wxcash_pins" in os.environ:
        if len(os.environ["wxcash_pins"]) != 0:
            wxcash_pins = os.environ["wxcash_pins"]
            wxcash_pins = wxcash_pins.replace('[', '').replace(']', '').replace('\'', '').replace(' ', '').split(',')
            printT(f"已获取并使用Env环境 wxcash_pins:{wxcash_pins}")
            return wxcash_pins
        else:
            printT('请先配置export wxcash_pins=["pt_pin1","pt_pin2"]')
            exit(4)
    printT('请先配置export wxcash_pins=["pt_pin1","pt_pin2"]')
    exit(4)


def randomString(e):
    t = "0123456789abcdef"
    a = len(t)
    n = ""
    for i in range(e):
        n = n + t[math.floor(random.random() * a)]
    return n


def Ua():
    UA = f'jdltapp;iPhone;3.1.0;{math.ceil(random.random() * 4 + 10)}.{math.ceil(random.random() * 4)};{randomString(40)}'

    return UA


def init(cookie,pin):
    url = "https://api.m.jd.com/client.action"
    headers = {
        "Host": "api.m.jd.com",
        "User-Agent": Ua(),
        "content-type": "application/x-www-form-urlencoded",
        "Referer": "https://servicewechat.com/wx91d27dbf599dff74/621/page-frame.html",
        "cookie": cookie
    }
    data = {
        "functionId": "cash_join_limited_redpacket",
        "body": json.dumps({"id": 5, "level": 3}),
        "appid": "CashRewardMiniH5Env",
        "loginType": "2",
        "loginWQBiz": "interact"
    }
    res = requests.post(url=url, headers=headers, data=data).json()
    # print(res)

    if res['code'] == 0:
        if res['data']['bizCode'] == 0:
            print(f'{pin}：发起成功，金额{res["data"]["result"]["amountStr"]}元')
            return 1
        else:
            print(f"{pin}：{res['data']['bizMsg']}")
            return 1
    else:
        return -1


def getCode(cookie,pin):
    url = "https://api.m.jd.com/client.action"
    headers = {
        "Host": "api.m.jd.com",
        "User-Agent": Ua(),
        "content-type": "application/x-www-form-urlencoded",
        "Referer": "https://servicewechat.com/wx91d27dbf599dff74/621/page-frame.html",
        "cookie": cookie
    }
    data = {
        "functionId": "cash_mob_home",
        "body": json.dumps({"isLTRedPacket": "1"}),
        "appid": "CashRewardMiniH5Env",
        "loginType": "2",
        "loginWQBiz": "interact"
    }
    res = requests.post(url=url, headers=headers, data=data).json()
    # print(res)

    if res['code'] == 0:
        inviteCode = res['data']['result']['inviteCode']
        shareDate = res['data']['result']['shareDate']
        print(f"{pin}：获取邀请码成功")
        return [inviteCode, shareDate]
    else:
        print(f"{pin}：{res['data']['bizMsg']}")
        return -1


def help(mycookie, pin, cookiesList, pinNameList, inviteCode, shareDate):
        url = "https://api.m.jd.com/client.action"
        data = {
            "functionId": "redpack_limited_assist",
            "body": json.dumps({"inviteCode": inviteCode, "shareDate": shareDate}),
            "appid": "CashRewardMiniH5Env",
            "loginType": "2",
            "loginWQBiz": "interact"
        }
        j = 0
        for i in range(len(cookiesList)):
            headers = {
                "Host": "api.m.jd.com",
                "User-Agent": Ua(),
                "content-type": "application/x-www-form-urlencoded",
                "Referer": "https://servicewechat.com/wx91d27dbf599dff74/621/page-frame.html",
                "cookie": cookiesList[i]
            }
            res = requests.post(url=url, headers=headers, data=data, timeout=3).json()
            # print(res)
            if j == 5:
                break
            if res['code'] == 0:
                if res['data']['bizCode'] == 0 and res['data']['result']['limitTimeAssist']['assistCode'] == '0':
                    j = j + 1
                    print('【' + pinNameList[i] + '助力' + unquote(pin) + '】：' + '助力成功！')
                elif res['data']['bizCode'] == 0 and res['data']['result']['limitTimeAssist']['assistCode'] == '206':
                    print('【' + pinNameList[i] + '助力' + unquote(pin) + '】：' + '已经助力过了！')
                    j = j + 1
                elif res['data']['bizCode'] == 0 and res['data']['result']['limitTimeAssist']['assistCode'] == '207':
                    print('【' + pinNameList[i] + '助力' + unquote(pin) + '】：' + '没有助力次数了！')
                elif res['data']['bizCode'] == 0 and res['data']['result']['limitTimeAssist']['assistCode'] == '210':
                    print('【'+pinNameList[i]+'助力'+unquote(pin)+'】：'+'自己不能助力自己！')

        reward(mycookie)


def reward(cookie):
    url = "https://api.m.jd.com/client.action"
    headers = {
        "Host": "api.m.jd.com",
        "User-Agent": Ua(),
        "content-type": "application/x-www-form-urlencoded",
        "Referer": "https://servicewechat.com/wx91d27dbf599dff74/621/page-frame.html",
        "cookie": cookie
    }
    for i in range(4):
        data = {
            "functionId": "cash_open_limited_redpacket",
            "body": json.dumps({"node": str(i + 1)}),
            "appid": "CashRewardMiniH5Env",
            "loginType": "2",
            "loginWQBiz": "interact"
        }
        res = requests.post(url=url, headers=headers, data=data).json()
        # print(res)

        if res['code'] == 0:
            if res['data']['bizCode'] == 0:
                print(f'领取成功，金额{res["data"]["result"]["amountStr"]}元')
            else:
                print(res['data']['bizMsg'])



def start():
    printT("############{}##########".format(script_name))
    wxcash_pins = getPinEnvs()
    get_jd_cookie = getJDCookie()
    cookiesList, pinNameList = get_jd_cookie.getcookies()
    wxcash_cookies = []
    nicks = []
    for ckname in wxcash_pins:
        try:
            ckNum = pinNameList.index(ckname)
            wxcash_cookies.append(cookiesList[ckNum])
            # nicks.append(nickNameList[ckNum])
        except Exception as e:
            try:
                ckNum = pinNameList.index(unquote(ckname))
                wxcash_cookies.append(cookiesList[ckNum])
                # nicks.append(nickNameList[ckNum])
            except:
                print(f"请检查被助力账号【{ckname}】名称是否正确？ck是否存在？提示：助力名字可填pt_pin的值、也可以填账号名。")
                continue
    if len(wxcash_cookies) == 0:
        exit(4)
    # use_thread(wxcash_cookies, wxcash_pins, cookiesList, pinNameList)
    
    for i in range(len(wxcash_cookies)):
        res = init(wxcash_cookies[i], wxcash_pins[i])
        if res != -1:
            res1 = getCode(wxcash_cookies[i], wxcash_pins[i])
            inviteCode = res1[0]
            shareDate = res1[1]
            help(wxcash_cookies[i], wxcash_pins[i], cookiesList, pinNameList, inviteCode, shareDate)


if __name__ == '__main__':
    start()
