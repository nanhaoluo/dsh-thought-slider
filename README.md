# dsh-thought-slider

DeepSeek Harness 思考强度滑块的独立视觉增强插件，提供 ZCode / Codex 风格的胶囊轨道、白色旋钮和最高档粒子效果。

## 使用前提

本插件增强 [dsh-better-reasoning-effort](https://github.com/HaoyueQin/dsh-better-reasoning-effort) 提供的滑块，**不会独立创建滑块或增加模型的思考档位**。需要在同一个 DSH Web profile 中安装并启用该插件的滑块功能，且当前模型至少配置两个思考档位。

兼容的 DOM 结构：

- 当前 `dsh-better-reasoning-effort` 0.5.4：`.bre-effort-track`、`.bre-effort-knob`、`.bre-effort-input`，从宿主的 `--bre-progress` 读取预览进度。
- 旧结构：`.bre-effort-slider-fill`、`.bre-effort-slider-thumb`，从宿主旋钮的百分比位置读取进度（外观兼容；意图吸附需要当前结构中提供明确 min/max/step 的 range 输入）。

上游若改变这些结构，需要重新核对兼容性。遇到未知结构或无有效进度时，插件保留宿主原样。

## 本地安装

在本项目目录运行：

```sh
npm run build
# 尚未安装滑块提供方时执行：
dsh plugin --profile web add dsh-better-reasoning-effort
# 将本地修复版安装到同一个 profile：
dsh plugin --profile web add .
```

安装完成后重启该 DSH profile 并刷新 Web 页面。其他 profile 请替换命令中的 `web`。插件的安装和重启边界见 [DSH CLI 官方说明](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/reference/README.md)。

移除本增强插件：

```sh
dsh plugin --profile web remove dsh-thought-slider
```

## 视觉与交互

- 20px 胶囊轨道、两侧 12px 间距、24px 正圆白色旋钮；旋钮中心对齐轨道端点，两侧各预留 12px，右端轨道盖在旋钮下方。
- 翠绿到青色、蓝紫色的档位渐变；填充和旋钮使用同一进度，与宿主点击坐标保持一致。
- 仅在最高档运行 12 个气泡粒子；其他档位暂停，遵循系统“减少动态效果”设置。
- 保留模型配置的档位名称、键盘操作、禁用状态及提交/回滚逻辑；拖动按配置档位进行意图吸附。有旧版中文标题时，将“思考等级”显示为“思考强度”。
- 保留模型选择入口，面板高度随视口限制并可滚动；不再以通用 CSS 隐藏菜单项。

## 修复内容

- 支持当前宿主的实际 DOM，解决旋钮/填充选择器失配导致增强不生效。
- 不再把宿主的百分比位置改写成 `calc()`，避免再次扫描时误判为 50%，以及视觉位置偏离拖动坐标。
- 样式和输入更新仅刷新受影响的滑块；拖动预览在当前事件中立即绘制，仅结构变化才按动画帧扫描，避免全页查询、额外一帧延迟及观察器自触发循环。
- 气泡横向容器使用有效的 `left` / `right` 定位，覆盖整条填充轨道。
- 卸载时取消待执行扫描、移除粒子与样式，恢复标题和插件自己的属性，同时保留宿主更新后的档位。

本插件通过 `dsh.profile.bundles` 挂载，不修改第三方 npm 插件源码。增强层负责显示与指针吸附，将吸附后的坐标通过原宿主指针事件交回宿主；松手只提交一次，不直接发送模型选择请求，也不额外注册快捷键。

## 1.0.1 意图吸附

仅在模型明确配置的离散档位停靠，精确落在档位时直接保持；落在两档之间时，计算选择较高档位的加权分数：

- 落点距离权重 **55%**：越接近高档，分数越高。
- 起点到落点的整体位移权重 **30%**：向右倾向高档，向左倾向低档；位移按一个档位间距归一化并限幅。
- 最近移动矢量权重 **15%**：采用衰减累计和平滑，过滤亚像素抖动，避免最后一点反向扰动推翻整体意图。

分数达到 0.5 选择高档，否则选择低档。无移动的单击选择最近档位；拖动过程中也只在离散档位预览。模型档位数来自 range 的 min/max/step，不固定为四档或五档；无有效离散定义时保留宿主输入。

响应优化包括：同档位内的连续移动不重复通知宿主，预览无需等待网络响应，只有松手才调用宿主原来的提交过程；请求被拒或拖动取消时仍由宿主恢复原档位。

## 开发与验证

```sh
npm ci
npx playwright install chromium
npm run build
npm test
npm pack
```

macOS 已安装 Google Chrome 时，浏览器测试会直接使用它；其他环境默认使用 Playwright Chromium，也可通过 `PLAYWRIGHT_CHANNEL` 选择浏览器通道。`npm run test:unit` 只运行无需浏览器的构建和生命周期检查；`npm run test:browser` 运行交互回归测试。

浏览器测试同时使用宿主模拟页面与上游 0.5.4 的真实 React 滑块组件（固定提交，测试专用 MIT 源码位于 tests/fixtures/upstream），覆盖三信号吸附、鼠标/触摸、单次提交、拒绝回滚、同事件预览、键盘、进度更新、菜单重建、窄屏浅色/深色、减少动态效果、卸载和重新安装。这些测试不连接真实 DSH 后端，不代替实际 profile 的模型请求验证。打包前会自动重建 `lib/client.js`。
