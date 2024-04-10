<script lang="ts">
  import { Circle } from 'svelte-loading-spinners';

  export let size: keyof typeof sizes = 'md';
  export let variant: keyof typeof colors = 'primary';

  let className = '';
  export { className as class };

  const sizes = {
    xs: 8,
    sm: 16,
    md: 32,
    lg: 64,
    xl: 128
  };

  const colors = {
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',
    card: 'hsl(var(--card))',
    'card-foreground': 'hsl(var(--card-foreground))',
    primary: 'hsl(var(--primary))',
    'primary-foreground': 'hsl(var(--primary-foreground))',
    secondary: 'hsl(var(--secondary))',
    'secondary-foreground': 'hsl(var(--secondary-foreground))',
    accent: 'hsl(var(--accent))',
    'accent-foreground': 'hsl(var(--accent-foreground))',
    destructive: 'hsl(var(--destructive))',
    'destructive-foreground': 'hsl(var(--destructive-foreground))'
  };
</script>

<div class={className}>
  <Circle size={sizes[size]} color={colors[variant]} />
</div>
