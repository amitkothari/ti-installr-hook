# ti-installr-hook [![Titanium](http://www-static.appcelerator.com/badges/titanium-git-badge-sq.png)](http://www.appcelerator.com/titanium/)



A titanium cli hook for deploying builds to [installr](http://www.installrapp.com), based on [ti-testflight-hook](https://github.com/dbankier/ti-testflight-hook)

## Installation

[![NPM](https://nodei.co/npm/ti-installr-hook.png)](https://nodei.co/npm/ti-installr-hook/)

~~~
$ npm install -g ti-installr-hook --unsafe-perm
~~~

You need `--unsafe-perm` to auto-install the hook.

## Usage

Add the installr api token to your tiapp.xml file.

~~~
  <property name="installr.api_token">ENTER_INSTALLR_API_TOKEN_HERE</property>
~~~

Optional - Set `installr.notify` to true, to notify all the testers that a new build is available. You can also list team names separated by commas

~~~
  <property name="installr.notify" type="bool">true</property>
~~~
OR
~~~
  <property name="installr.notify" type="bool">Devs,QA</property>
~~~

Optional - Set `installr.add` to true, to allow all previous testers access to the new build, but not email them. You can also list team names separated by commas

~~~
  <property name="installr.add" type="bool">true</property>
~~~
OR
~~~
  <property name="installr.add" type="bool">PMs,Legal</property>
~~~


Optional - Set `installr.default_testers` email address you want to invite to the latest build. Use comma-space for more than one email address

~~~
  <property name="installr.default_testers">someemail@domain.com, other@email.com</property>
~~~


Use the `--installr` flag with the titanium cli to upload to installr. For example:

~~~
$ ti build -p ios -T dist-adhoc --installr
~~~

Set release notes using `--installr-release-notes` flag. For example:

~~~
$ ti build -p ios -T dist-adhoc --installr --installr-release-notes='New build with awesome features'
~~~

You can also set notify and add using `--installr-notify` and `--installr-add` flags. For example:

~~~
$ ti build -p ios -T dist-adhoc --installr --installr-release-notes='New build' --installr-notify='Devs,QA' --installr-add='Legal'
~~~

**If not set, you will be prompted for release notes and notify flag**



### Thanks to

- [dbankier](https://github.com/dbankier) for  [ti-testflight-hook](https://github.com/dbankier/ti-testflight-hook)



### Licence
Licensed under the [MIT License](http://opensource.org/licenses/MIT)
