/**
 * TextNow配置请求修改脚本
 * 用于在请求阶段修改参数，使服务器认为用户有权限移除广告
 */

const userAgent = $request.headers['User-Agent'];
const url = $request.url;

// 检查是否为TextNow相关请求
function isTextNowRequest(url) {
  return url.includes('api.textnow.me') || 
         url.includes('textnow') || 
         $request.headers['Host']?.includes('textnow');
}

function modifyHeaders() {
  let headers = $request.headers;
  
  // 添加premium用户标识
  headers['X-TN-Premium'] = 'true';
  headers['X-TN-Feature-Premium'] = 'enabled';
  
  // 修改特定header以绕过广告检测
  if (headers['X-Client-Type']) {
    headers['X-Client-Type'] = 'TN_IOS_PREMIUM';
  }
  
  if (url.indexOf('/ads') > -1 || url.indexOf('/ad_config') > -1 || url.indexOf('/ad_attribution') > -1) {
    // 如果是广告相关请求，直接拦截
    $done({status: 200, headers: {}, body: '{}'});
    return;
  }
  
  // 返回修改后的请求
  $done({headers});
}

// 主处理逻辑
(() => {
  // 仅处理TextNow应用请求
  if (userAgent && userAgent.indexOf('TextNow') > -1) {
    modifyHeaders();
  } else {
    $done({});
  }
})();