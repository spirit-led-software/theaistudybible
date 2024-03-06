<script lang="ts">
  import { PUBLIC_AUTH_URL } from '$env/static/public';
  import AskQuestionsBar from '$lib/components/AskQuestionsBar.svelte';
  import Logo from '$lib/components/branding/Logo.svelte';
  import Avatar from '$lib/components/user/Avatar.svelte';
  import Icon from '@iconify/svelte';
  import { isAdmin } from '@revelationsai/client/services/user';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<svelte:head>
  <title>RevelationsAI: Home</title>
  <meta
    name="description"
    content="Discover Jesus Christ with the power of AI. Learn more about Jesus Christ, the Bible, and uncover mysteries of the Christian faith."
  />
  <meta name="keywords" content="Jesus, Christ, Revelations, AI, Artificial Intelligence" />
</svelte:head>

<div
  class="carousel carousel-vertical h-screen bg-gradient-to-t from-slate-900 to-slate-600 text-white"
>
  <div class="carousel-item h-full">
    <div
      class="relative flex h-full w-full flex-col place-items-center justify-center space-y-2 p-10"
    >
      <div class="mb-2 flex w-5/6 place-items-center justify-center lg:w-2/3 xl:w-1/2">
        <Logo size="5xl" colorscheme="light" />
      </div>
      <div class="flex w-5/6 justify-center lg:w-2/3 xl:w-1/2">
        <h1 class="p-2 text-center text-base text-white lg:text-xl">
          An all new way to discover Jesus Christ with the power of{' '}
          <span
            class="inline-block bg-gradient-to-t from-blue-50 to-blue-400 bg-clip-text font-bold text-transparent"
          >
            AI
          </span>
        </h1>
      </div>

      <div
        class="flex w-5/6 flex-col items-center justify-center space-y-4 text-center lg:w-2/3 xl:w-1/2"
      >
        <AskQuestionsBar />
        <div
          class="flex flex-wrap place-items-center justify-center space-x-4 text-sm lg:text-base"
        >
          {#if !data.user}
            <a
              href={`${PUBLIC_AUTH_URL}/sign-in`}
              class="flex place-items-center justify-center py-1 text-blue-200 hover:underline"
            >
              <Icon icon="mdi:login" class="mr-1" />
              Login
            </a>
          {:else}
            <a
              href={`${PUBLIC_AUTH_URL}/logout`}
              class="flex place-items-center justify-center py-1 text-blue-200 hover:underline"
            >
              <Avatar size="xs" class="mr-1" />
              Logout
            </a>
            <a
              href="/upgrade"
              class="flex place-items-center justify-center py-1 text-blue-200 hover:underline"
            >
              <Icon icon="mdi:account-credit-card" class="mr-1" />
              Upgrade
            </a>
            {#if isAdmin(data.user)}
              <a
                href="/admin"
                class="flex place-items-center justify-center py-1 text-blue-200 hover:underline"
              >
                <Icon icon="mdi:account-cog" class="mr-1" />
                Admin
              </a>
            {/if}
          {/if}
          <a
            href="/chat"
            class="flex place-items-center justify-center py-1 text-blue-200 hover:underline"
          >
            <Icon icon="mdi:chat" class="mr-1" />
            Chat
          </a>
          <a
            href="/devotions"
            class="flex place-items-center justify-center py-1 text-blue-200 hover:underline"
          >
            <Icon icon="mdi:book-open-page-variant" class="mr-1" />
            Devotions
          </a>
          <a
            href="/search"
            class="flex place-items-center justify-center py-1 text-blue-200 hover:underline"
          >
            <Icon icon="mdi:magnify" class="mr-1" />
            Resource Search
          </a>
          <a
            href="/privacy-policy"
            class="flex place-items-center justify-center py-1 text-blue-200 hover:underline"
          >
            <Icon icon="mdi:shield-account" class="mr-1" />
            Privacy Policy
          </a>
        </div>
      </div>
      <h2 class="flex flex-col place-items-end justify-center pt-5 text-white md:flex-row">
        It's even better on mobile.
      </h2>
      <div class="flex w-2/3 items-center justify-center text-white lg:w-1/3">
        <a href="https://apps.apple.com/us/app/revelationsai/id6463644660" target="_blank">
          <img
            src="/app-store-badge.svg"
            alt="Download on the App Store"
            width={400}
            class="w-32 lg:w-48"
          />
        </a>
        <a
          href="https://play.google.com/store/apps/details?id=com.passgoco.revelationsai&pli=1"
          target="_blank"
        >
          <img
            src="/google-play-badge.png"
            alt="Download on the Google Play Store"
            width={500}
            class="w-40 lg:w-64"
          />
        </a>
      </div>
      <div class="absolute bottom-2">
        <Icon icon="mdi:chevron-down" class="flex h-10 w-10 animate-bounce flex-col align-bottom" />
      </div>
    </div>
  </div>
  <div class="carousel-item h-full">
    <div
      class="relative flex h-full w-full flex-col place-items-center justify-center p-5 text-center lg:px-64"
    >
      <Icon icon="carbon:chat" class="h-10 w-10 lg:h-20 lg:w-20" />
      <h2
        class="mt-5 inline-block bg-gradient-to-t from-blue-50 to-blue-400 bg-clip-text text-lg font-bold text-transparent lg:text-2xl"
      >
        Faith Unveiled Through AI Chat
      </h2>
      <p class="mt-3 text-xs lg:text-base">
        Explore Christian theology like never before with our AI chat. Gain profound insights into
        the Bible through personalized conversations. Embrace the fusion of cutting-edge technology
        and divine wisdom for a deeper spiritual journey. Elevate your faith experience in our
        app—where AI meets theology.
      </p>
      <a href="/chat" class="mt-5 text-sm text-blue-300 hover:underline">Try it now</a>
    </div>
  </div>
  <div class="carousel-item h-full">
    <div
      class="relative flex h-full w-full flex-col place-items-center justify-center p-5 text-center lg:px-64"
    >
      <Icon icon="mdi:hands-pray" class="h-10 w-10 lg:h-20 lg:w-20" />
      <h2
        class="mt-5 inline-block bg-gradient-to-t from-blue-50 to-blue-400 bg-clip-text text-lg font-bold text-transparent lg:text-2xl"
      >
        AI-Driven Daily Devotions for Spiritual Enrichment
      </h2>
      <p class="mt-3 text-xs lg:text-base">
        Immerse yourself in daily inspiration with our AI-crafted devotions. Uncover personalized
        messages tailored to uplift your spirit and deepen your connection with faith. Let
        artificial intelligence curate meaningful reflections, fostering a daily ritual of spiritual
        growth. Elevate your devotionals to a new level—where technology meets the sacred, bringing
        you closer to the heart of your beliefs every day.
      </p>
      <a href="/devotions" class="mt-5 text-sm text-blue-300 hover:underline">View latest</a>
    </div>
  </div>
  <div class="carousel-item h-full">
    <div
      class="relative flex h-full w-full flex-col place-items-center justify-center p-5 text-center lg:px-64"
    >
      <Icon icon="mdi:book-check-outline" class="h-10 w-10 lg:h-20 lg:w-20" />
      <h2
        class="mt-5 inline-block bg-gradient-to-t from-blue-50 to-blue-400 bg-clip-text text-lg font-bold text-transparent lg:text-2xl"
      >
        Content You Can Trust
      </h2>
      <p class="mt-3 text-xs lg:text-base">
        Think of our app as your own spiritual guide infused with the wisdom of the ages. Retrieval
        augmented generation (RAG) in our app means that our AI doesn't just generate content from
        scratch. It retrieves relevant insights from a vast knowledge base and crafts personalized
        daily devotions just for you. It's like having an ancient library at its digital fingertips,
        pulling out the perfect nuggets of wisdom to inspire and guide you on your daily spiritual
        journey. In a nutshell, it's the seamless blend of timeless knowledge and cutting-edge tech,
        creating a uniquely tailored experience for your soul.
      </p>
    </div>
  </div>
</div>
