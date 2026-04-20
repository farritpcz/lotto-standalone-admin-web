// Types: Banner CMS shared types
// Parent: src/components/cms/BannerManager.tsx

export interface Banner {
  id: number
  title?: string
  image_url: string
  link_url: string
  sort_order: number
  is_active: boolean
  status?: string
}

export interface BannerForm {
  title: string
  image_url: string
  link_url: string
  is_active: boolean
}
