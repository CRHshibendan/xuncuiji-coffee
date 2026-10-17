# 寻萃集 · 咖啡冲煮互动课堂

给新手的中文手冲咖啡课堂，包含 Melitta / Chemex 两套器具、基础手势跟练与进阶自由冲煮。

## 网站

GitHub Pages：https://crhshibendan.github.io/xuncuiji-coffee/

## 本地运行

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

打开 http://127.0.0.1:4173/ 。无须安装依赖。

## 更新与检查

GitHub Pages 从 `main` 分支根目录发布，推送后自动更新。

```sh
node --test tests/brew-model.test.cjs
```

咖啡手记和学习进度保存在访问者自己的浏览器中。冲煮时间按 5 倍演示，风味结果为确定性教学模拟，不是实验室测量或真实风味预测。

器具 SVG 参考项目所有者提供的「寻萃集」源码；首页场景图由 AI 生成。详细素材记录见 ASSETS.md。
