# dsh-thought-slider

DeepSeek Harness 思考强度滑块的独立视觉增强插件，提供 ZCode / Codex 风格的胶囊轨道、白色旋钮和最高档粒子效果。

## 使用前提

本插件增强现有 `.bre-effort-slider` 滑块（包括 [dsh-better-reasoning-effort](https://github.com/HaoyueQin/dsh-better-reasoning-effort) 的对应结构），**不会独立创建滑块或增加模型的思考档位**。需要在同一个 DSH Web profile 中安装并启用该插件的滑块功能，且当前模型至少配置两个思考档位。

兼容的 DOM 结构：

- 当前 `dsh-better-reasoning-effort` 0.5.4：`.bre-effort-track`、`.bre-effort-knob`、`.bre-effort-input`，从宿主的 `--bre-progress` 读取预览进度。
- 旧结构：`.bre-effort-slider-fill`、`.bre-effort-slider-thumb`，从宿主旋钮的百分比位置读取进度（外观兼容；意图吸附需要明确的 range 定义，或 role=slider 的 aria-valuemin/max 离散档位定义）。

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

- 24px 胶囊轨道、两侧 14px 间距、28px 正圆白色旋钮；旋钮中心对齐两端圆角的圆心，两侧各内收 12px，端部轨道完全盖在旋钮下方；最左端不显示刻度。
- 全长色带随位置从青蓝连续过渡到蓝紫，最高档叠加蓝紫色流光；遮罩和旋钮共用一份插值位置，掉帧时仍保持绑定，渐变与流光不随可见长度拉伸。
- 离开最高档时，刻度从左到右错开恢复，各自从右侧向左移动并线性渐显，单颗进入缩短至 180ms。
- 最高档运行 20 个粒子，单程 2.0–3.6 秒。每颗独立随机高度、速度、大小和透明度；约 80% 越过左侧裁切边缘后销毁，约 20% 提前淡出。生命周期结束只替换该粒子，不触发全页扫描；减少动态效果时暂停。
- 保留模型配置的档位名称、键盘操作、禁用状态及提交/回滚逻辑；拖动连续跟随指针，松手按配置档位进行意图吸附。点击轨道先缓动到鼠标落点，等待实际动画到达后再吸附到最近档位；两段显示只提交最终档位。有旧版中文标题时，将“思考等级”显示为“思考强度”。
- 保留宿主模型菜单的布局、颜色、模型列表和原有档位标签；外观修改只作用于滑块及其标题。

## 修复内容

- 支持当前宿主的实际 DOM，解决旋钮/填充选择器失配导致增强不生效。
- 不再把宿主的百分比位置改写成 `calc()`，避免再次扫描时误判为 50%，以及视觉位置偏离拖动坐标。
- 样式和输入更新仅刷新受影响的滑块；拖动预览在当前事件中立即绘制，仅结构变化才按动画帧扫描，避免全页查询、额外一帧延迟及观察器自触发循环。
- 气泡横向容器使用有效的 `left` / `right` 定位，覆盖整条填充轨道。
- 卸载时取消待执行扫描、移除粒子与样式，恢复标题和插件自己的属性，同时保留宿主更新后的档位。

本插件通过 `dsh.profile.bundles` 挂载，不修改第三方 npm 插件源码。增强层负责显示与指针吸附，通过原宿主指针事件交回宿主，不直接发送模型选择请求，也不额外注册快捷键。MTL 模型菜单支持拖动时合并并同步最新档位；普通 range 宿主仍保留松手提交协议。
