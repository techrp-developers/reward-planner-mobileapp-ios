#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(AppIconSwitcher, NSObject)
RCT_EXTERN_METHOD(setAppIcon:(NSString * _Nullable)iconName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getCurrentIcon:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(isSupported:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
@end
