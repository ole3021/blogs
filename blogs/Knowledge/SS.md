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

### 安装服务

1. 登陆主机

   ```
   ssh root@服务器IP地址
   ```

   ***

   > 密码在服务器详情中可以找到

2. 添加 elrepo 的 gpg key 和源并升级 kernel 内核

   ```
   sudo rpm --import https://www.elrepo.org/RPM-GPG-KEY-elrepo.org
   sudo rpm -Uvh http://www.elrepo.org/elrepo-release-7.0-2.el7.elrepo.noarch.rpm
   sudo yum --enablerepo=elrepo-kernel install kernel-ml -y
   ```

3. 查看系统内核并使用最新内核

   ```
   rpm -qa | grep kernel
   sudo egrep ^menuentry /etc/grub2.cfg | cut -f 2 -d \'
   sudo grub2-set-default x # x是最新内核的标识
   sudo reboot
   ```

4. 启动 BBR

   ```
   sudo echo 'net.core.default_qdisc=fq' | tee -a /etc/sysctl.conf
   sudo echo 'net.ipv4.tcp_congestion_control=bbr' |  tee -a /etc/sysctl.conf
   sudo sysctl -p
   sudo lsmod | grep bbr
   ```

5. 安装 pip 和 shadowsocks

   ```
   yum install python-setuptools && easy_install pip
   pip install shadowsocks
   ```

6. 创建 SS 的配置文件 `/etc/shadowsocks.json`

   ```
   {
       "server": "0.0.0.0",
       "server_port": 8388,
       "password": "uzon57jd0v869t7w",
       "method": "aes-256-cfb"
   }
   ```

   ***

   > - `method`为加密方法，可选`aes-128-cfb, aes-192-cfb, aes-256-cfb, bf-cfb, cast5-cfb, des-cfb, rc4-md5, chacha20, salsa20, rc4, table`
   > - `server_port`为服务监听端口
   > - `password`为密码

7. 配置 SS 启动脚本 `/etc/systemd/system/shadowsocks.service`

   ```
   [Unit]
   Description=Shadowsocks

   [Service]
   TimeoutStartSec=0
   ExecStart=/usr/bin/ssserver -c /etc/shadowsocks.json

   [Install]
   WantedBy=multi-user.target
   ```

8. 启动 SS 服务

   ```
   systemctl enable shadowsocks
   systemctl start shadowsocks
   ```

9. 检查 SS 状态

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
Aug 20 12:19:37 vultr.guest ssserver[10263]: 2017-08-20 12:19:37 INFO     loading libcrypto from libcrypto.so.10
Aug 20 12:19:37 vultr.guest ssserver[10263]: 2017-08-20 12:19:37 INFO     starting server at 0.0.0.0:3021
```

11. 开放防火墙相应的端口

> GCP 不需要配置 firewall，只需要为实例添加`网络标记` 并在 VPC 网络的防火墙规则中为相应的标记配置对应的开放端口即可。

```
firewall-cmd --permanent --add-port=xxxx/tcp //xxxx 为设置的ss服务端口
firewall-cmd --reload
```

---

> 成功后会显示`success`

## 连接 SS 服务

连接 SS 推荐使用以下客户端进行连接

- Mac [ShadowsocksX-NG](https://github.com/shadowsocks/ShadowsocksX-NG)
- Windows [shadowsocks-windows](https://github.com/shadowsocks/shadowsocks-windows)

### TODO

- [ ] 整合部署安装代码为脚本方便实用
