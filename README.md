# 寻萃集 · 咖啡冲煮互动课堂

给新手的中文咖啡课堂，包含 Melitta、Chemex、摩卡壶、冷萃、意式、虹吸、法压壶。七种器具均有基础手势跟练与进阶自由冲煮，共用实物操作台。

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
node --test tests/*.test.cjs
```

咖啡手记和学习进度保存在访问者自己的浏览器中。冲煮时间经过加速演示，风味结果为确定性教学模拟，不是实验室测量或真实风味预测。

器具 SVG 参考项目所有者提供的「寻萃集」源码；首页场景图由 AI 生成。详细素材记录见 ASSETS.md。

手机操作：点击台面上方的参数卡调整豆量、研磨、水温与流速。点「放大研磨」专注转柄，再返回全景；「按住注水」松手即停，也可直接拖壶绕圈。

独立手冲课堂位于 `learn.html`，含六个章节、滚动萃取示意、烘焙度探索、比例/研磨/水温演示、七种器具的步骤配方和风味调整建议。首页课程卡片直接进入对应章节，课堂可跳转到同器具的基础或自由练习。动画支持暂停，并尊重系统的减少动态效果设置。

新增器具直接在 `workshop.html?tool=frenchpress&mode=advanced` 等地址操作。`equipment-art.js` 绘制器具与颗粒，`equipment-studio.js` 处理拖动、称豆、转柄、倾杯倒粉、液体、压杆与物理开关，`free-model.js` 记录实际原料和动作；旧 `method-lab.html` 链接自动转入实物工坊。
