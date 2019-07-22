---
title: '自建ShadowSocks服务备忘录'
meta: '通过手动在虚拟云主机上搭建实现ShadowSocks服务，并使用Google BBR来加速访问速度。'
category: Knowledge
tags: [sss]
cover: /blog-images/sss.jpg
created: 2019-06-18
---

# 自建 ShadowSocks 服务备忘录

## 购买云主机

### GCP 主机

服务器主机推荐使用 Google Cloud Platform 香港机房的 Compute Engine(实测速度最快)

### 开通主机

1. 登陆主机

   ```
   ssh root@服务器IP地址
   ```

   ***

   > 密码在服务器详情中可以找到

### 升级 Kernel 内核

开通前可以使用`uname -r`命令来检查主机内核版本，可以看到`3.10.0-514.2.2.el7.x86_64`的内核版本信息提示。

1. 添加 elrepo 的 gpg key 和源并升级 kernel 内核

   ```
   sudo rpm --import https://www.elrepo.org/RPM-GPG-KEY-elrepo.org
   sudo rpm -Uvh http://www.elrepo.org/elrepo-release-7.0-2.el7.elrepo.noarch.rpm

   sudo yum --enablerepo=elrepo-kernel install kernel-ml -y
   ```

   安装成功后可以使用`rpm -qa | grep kernel`来检查结果，在结果中应该可以看到`kernel-ml-5.2.0-1.el7.elrepo.x86_64`之类的 kernel 大于`4.9`版本的新内核。

2. 查看系统内核并使用最新内核

使用`sudo egrep ^menuentry /etc/grub2.cfg | cut -f 2 -d \'`来查看所有的内核选项，如下

```
CentOS Linux (5.2.0-1.el7.elrepo.x86_64) 7 (Core)
CentOS Linux (3.10.0-957.21.3.el7.x86_64) 7 (Core)
CentOS Linux (3.10.0-957.el7.x86_64) 7 (Core)
CentOS Linux (0-rescue-477516cc6f76b9cd7e5db3578d35c2af) 7 (Core)
```

使用`sudo grub2-set-default x` (x 是最新内核的位置,位置从 0 开始，这里是 0), 成功之后使用`sudo reboot` 重启系统。

3. 启动 BBR

   ```
   echo 'net.core.default_qdisc=fq' | sudo tee -a /etc/sysctl.conf
   echo 'net.ipv4.tcp_congestion_control=bbr' | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

   这里 BBR 已经成功启动 可以使用`sudo sysctl net.ipv4.tcp_available_congestion_control` 来查看 BBR 是否启用, 成功启动的结果如下。

   ```
   net.ipv4.tcp_available_congestion_control = bbr cubic reno
   ```

   再使用`sudo sysctl -n net.ipv4.tcp_congestion_control`来检查结果，成功的结果响应如下

   ```
   bbr
   ```

   最终检查 kernel 已经加载 BBR `lsmod | grep bbr`, 成功的结果如下

   ```
   tcp_bbr                16384  0
   ```

### 安装代理服务

#### IPSEC

Ipsec 安装内容可以查看更详细[说明文档](https://github.com/hwdsl2/setup-ipsec-vpn/blob/master/README-zh.md)

1. 安装 IPSEC

   ```
   sudo yum install wget # 如果系统中没有包含wget
   wget https://git.io/vpnsetup-centos -O vpnsetup.sh
   ```

2. 修改配置信息 `~/vpnsetup.sh`，修改其中的链接密钥，用户名和密码信息。

   ```
   YOUR_IPSEC_PSK='someSecretKey'
   YOUR_USERNAME='username'
   YOUR_PASSWORD='password'
   ```

3. 执行安装脚本

   ```
   sudo sh vpnsetup.sh
   ```

   安装成功后会显示如下信息

   ```
    ## Creating VPN configuration...
    ## Updating sysctl settings...
    ## Updating IPTables rules...
    ## Creating basic Fail2Ban rules...
    ## Enabling services on boot...
    ## Starting services...
    ================================================
    IPsec VPN server is now ready for use!
    Connect to your new VPN with these details:
    Server IP: xx.xxx.xxx.xx
    IPsec PSK: someSecretKey
    Username: username
    Password: password
    Write these down. You'll need them to connect!
    Important notes: https://git.io/vpnnotes
    Setup VPN clients: https://git.io/vpnclients
    ================================================
   ```

   然后在软件中使用上面的 IP 地址和链接信息进行链接就可以了。

#### ShadowSocks

1. 安装 pip 和 shadowsocks

```

yum install python-setuptools && easy_install pip
pip install shadowsocks

```

2. 创建 SS 的配置文件 `/etc/shadowsocks.json`

```

{
"server": "0.0.0.0",
"server_port": 8388,
"password": "uzon57jd0v869t7w",
"method": "aes-256-cfb"
}

```

---

> - `method`为加密方法，可选`aes-128-cfb, aes-192-cfb, aes-256-cfb, bf-cfb, cast5-cfb, des-cfb, rc4-md5, chacha20, salsa20, rc4, table`
> - `server_port`为服务监听端口
> - `password`为密码

3. 配置 SS 启动脚本 `/etc/systemd/system/shadowsocks.service`

```

[Unit]
Description=Shadowsocks

[Service]
TimeoutStartSec=0
ExecStart=/usr/bin/ssserver -c /etc/shadowsocks.json

[Install]
WantedBy=multi-user.target

```

4. 启动 SS 服务

```

systemctl enable shadowsocks
systemctl start shadowsocks

```

5. 检查 SS 状态

```

systemctl status shadowsocks -l

```

服务启动成功后会显示如下内容

```

● shadowsocks.service - Shadowsocks
Loaded: loaded (/etc/systemd/system/shadowsocks.service; enabled; vendor preset: disabled)
Active: active (running) since Sun 2017-08-20 12:19:37 UTC; 11s ago
Main PID: 10263 (ssserver)
CGroup: /system.slice/shadowsocks.service
└─10263 /usr/bin/python /usr/bin/ssserver -c /etc/shadowsocks.json

Aug 20 12:19:37 vultr.guest systemd[1]: Started Shadowsocks.
Aug 20 12:19:37 vultr.guest systemd[1]: Starting Shadowsocks...
Aug 20 12:19:37 vultr.guest ssserver[10263]: INFO: loading config from /etc/shadowsocks.json
Aug 20 12:19:37 vultr.guest ssserver[10263]: 2017-08-20 12:19:37 INFO loading libcrypto from libcrypto.so.10
Aug 20 12:19:37 vultr.guest ssserver[10263]: 2017-08-20 12:19:37 INFO starting server at 0.0.0.0:3021

```

### 跟改防火墙配置

- IPSEC 使用 UDP 协议链接，端口固定为 `500,4500`
- SS 使用 tcp 协议链接，端口为在配置中自定义的端口

#### 开放平台防火墙

不同的云服务器平台有不同的防火墙规则配置，再响应的平台中配置相应的防火墙规则即可。并在 VPC 网络的防火墙规则中为相应的标记配置对应的开放端口即可。

#### 开放系统防火墙相应的端口

```

firewall-cmd --permanent --add-port=xxxx/tcp //xxxx 为设置的 ss 服务端口
firewall-cmd --reload

```

---

> 成功后会显示`success`

### 连接服务

#### IPSEC

系统中自带的服务中进行配置即可

#### SS

连接 SS 推荐使用以下客户端进行连接

- Mac [ShadowsocksX-NG](https://github.com/shadowsocks/ShadowsocksX-NG)
- Windows [shadowsocks-windows](https://github.com/shadowsocks/shadowsocks-windows)
