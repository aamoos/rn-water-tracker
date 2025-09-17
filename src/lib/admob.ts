// src/lib/admob.ts
import mobileAds, { MaxAdContentRating, AppOpenAd, InterstitialAd, RewardedAd, BannerAd, TestIds, AdEventType, RewardedAdEventType } from 'react-native-google-mobile-ads';

// AdMob 앱 ID (실제 프로덕션에서는 실제 ID로 교체)
export const ADMOB_APP_ID = __DEV__ ? 'ca-app-pub-3940256099942544~3347511713' : 'ca-app-pub-8260467160805881~5189595267';

// 광고 단위 ID들 (테스트용, 실제 프로덕션에서는 실제 ID로 교체)
export const AD_UNIT_IDS = {
  banner: __DEV__ ? TestIds.BANNER : 'ca-app-pub-8260467160805881/5783942893',
  interstitial: __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-8260467160805881/2533256732',
  rewarded: __DEV__ ? TestIds.REWARDED : 'ca-app-pub-8260467160805881/8821169772',
};

// AdMob 초기화
export const initializeAdMob = async () => {
  try {
    // Expo Go에서는 네이티브 모듈을 사용할 수 없음
    if (__DEV__ && !global.__expo_native_modules__) {
      console.log('AdMob not available in Expo Go - Development Build required');
      return false;
    }

    await mobileAds().initialize();

    // 연령 등급 설정 (선택사항)
    await mobileAds().setRequestConfiguration({
      maxAdContentRating: MaxAdContentRating.G,
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
    });

    console.log('AdMob initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize AdMob:', error);
    return false;
  }
};

// 전면 광고 로드 및 표시
export class InterstitialAdManager {
  private static instance: InterstitialAdManager;
  private interstitial: InterstitialAd | null = null;
  private isLoaded = false;

  static getInstance(): InterstitialAdManager {
    if (!InterstitialAdManager.instance) {
      InterstitialAdManager.instance = new InterstitialAdManager();
    }
    return InterstitialAdManager.instance;
  }

  async loadAd(): Promise<void> {
    try {
      this.interstitial = InterstitialAd.createForAdRequest(AD_UNIT_IDS.interstitial);

      this.interstitial.addAdEventListener(AdEventType.LOADED, () => {
        this.isLoaded = true;
        console.log('Interstitial ad loaded');
      });

      this.interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
        console.error('Interstitial ad error:', error);
        this.isLoaded = false;
      });

      this.interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        this.isLoaded = false;
        // 광고가 닫힌 후 다음 광고 미리 로드
        this.loadAd();
      });

      await this.interstitial.load();
    } catch (error) {
      console.error('Failed to load interstitial ad:', error);
    }
  }

  async showAd(): Promise<boolean> {
    if (this.isLoaded && this.interstitial) {
      try {
        await this.interstitial.show();
        return true;
      } catch (error) {
        console.error('Failed to show interstitial ad:', error);
        return false;
      }
    }
    return false;
  }

  isAdLoaded(): boolean {
    return this.isLoaded;
  }
}

// 리워드 광고 매니저
export class RewardedAdManager {
  private static instance: RewardedAdManager;
  private rewarded: RewardedAd | null = null;
  private isLoaded = false;

  static getInstance(): RewardedAdManager {
    if (!RewardedAdManager.instance) {
      RewardedAdManager.instance = new RewardedAdManager();
    }
    return RewardedAdManager.instance;
  }

  async loadAd(): Promise<void> {
    try {
      this.rewarded = RewardedAd.createForAdRequest(AD_UNIT_IDS.rewarded);

      this.rewarded.addAdEventListener(AdEventType.LOADED, () => {
        this.isLoaded = true;
        console.log('Rewarded ad loaded');
      });

      this.rewarded.addAdEventListener(AdEventType.ERROR, (error) => {
        console.error('Rewarded ad error:', error);
        this.isLoaded = false;
      });

      this.rewarded.addAdEventListener(AdEventType.CLOSED, () => {
        this.isLoaded = false;
        // 광고가 닫힌 후 다음 광고 미리 로드
        this.loadAd();
      });

      await this.rewarded.load();
    } catch (error) {
      console.error('Failed to load rewarded ad:', error);
    }
  }

  async showAd(): Promise<{ showed: boolean; rewarded: boolean }> {
    if (this.isLoaded && this.rewarded) {
      try {
        let userRewarded = false;

        this.rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
          console.log('User rewarded:', reward);
          userRewarded = true;
        });

        await this.rewarded.show();
        return { showed: true, rewarded: userRewarded };
      } catch (error) {
        console.error('Failed to show rewarded ad:', error);
        return { showed: false, rewarded: false };
      }
    }
    return { showed: false, rewarded: false };
  }

  isAdLoaded(): boolean {
    return this.isLoaded;
  }
}