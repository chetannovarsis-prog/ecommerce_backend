--
-- PostgreSQL database dump
--

\restrict ujm8oc3pGfAEFv5qHDY8sEfKF9SwHM2ZxbvCMZKNqOhjWWc9OjcDqIxZL1YC394

-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: Admin; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Category" (id, name, "createdAt", description) VALUES ('69ef1249-77ca-4f55-b4ff-7fd041f60ef0', 'party wear', '2026-03-12 06:19:05.46', NULL);
INSERT INTO public."Category" (id, name, "createdAt", description) VALUES ('9c30ba21-3659-4908-aa72-209ecfbb76f5', 'men', '2026-03-12 10:05:43.576', NULL);
INSERT INTO public."Category" (id, name, "createdAt", description) VALUES ('dd1edd1c-f7fb-425c-95b8-9fbbd125bc85', 'casual', '2026-03-13 05:00:05.476', NULL);
INSERT INTO public."Category" (id, name, "createdAt", description) VALUES ('dbb02ba6-efdd-4a4c-ac95-06be736900ac', 'formal', '2026-03-13 05:00:15.907', NULL);


--
-- Data for Name: Collection; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Collection" (id, name, "createdAt", description, "imageUrl") VALUES ('ff42e06a-8ebd-411f-8deb-bf116f68581a', 'winter wear ', '2026-03-13 05:05:30.73', '', NULL);
INSERT INTO public."Collection" (id, name, "createdAt", description, "imageUrl") VALUES ('5c4338b2-dd3a-4efb-848e-86f49a4f9900', 'shorts', '2026-03-13 05:06:06.082', '', NULL);
INSERT INTO public."Collection" (id, name, "createdAt", description, "imageUrl") VALUES ('70080c80-233c-4319-9e1c-4afddafd5f93', 'rajasthani', '2026-03-13 05:10:50.49', '', NULL);
INSERT INTO public."Collection" (id, name, "createdAt", description, "imageUrl") VALUES ('6d1bb9c0-f795-4204-866c-aafbff56b143', 'summer collection', '2026-03-12 10:42:31.824', '', 'https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773404184113.png');
INSERT INTO public."Collection" (id, name, "createdAt", description, "imageUrl") VALUES ('cf96c991-3f77-4b05-a957-b160a926a56d', 'didi ki shadi ', '2026-03-13 09:59:13.752', 'prashanssa ki didi ke liye ', 'https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773404235295.png');
INSERT INTO public."Collection" (id, name, "createdAt", description, "imageUrl") VALUES ('25a1dc7c-029e-44b9-b64b-e25e1525a4de', 'Newest ', '2026-03-13 05:07:11.651', '', 'https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773404285143.png');
INSERT INTO public."Collection" (id, name, "createdAt", description, "imageUrl") VALUES ('75e7a69b-8df7-4296-a422-12087cc6dc39', 'diwali sale', '2026-03-13 05:10:23.794', '', 'https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773404421119.png');


--
-- Data for Name: Customer; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Customer" (id, email, name, "createdAt", "updatedAt", otp, "otpExpires", password, provider) VALUES ('15998fab-ddd6-4902-b0f4-5a09ce1fdb8a', 'test@gmail.com', 'Neeraj', '2026-03-16 05:01:52.025', '2026-03-16 05:01:52.025', NULL, NULL, 'admin123', 'local');


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Product" (id, name, subtitle, handle, description, price, images, stock, "createdAt", "updatedAt", "discountPrice", "isDiscountable", "hoverThumbnailUrl", "thumbnailUrl") VALUES ('9682671f-8814-4cae-abc6-8abc0eace501', 'dress', '', 'dress-1', '', 4999, '{https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773485026014.png,https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773485027199.png,https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773485027680.png}', 100, '2026-03-14 10:43:48.141', '2026-03-14 10:43:48.141', 1499, true, 'https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773485027199.png', 'https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773485026014.png');
INSERT INTO public."Product" (id, name, subtitle, handle, description, price, images, stock, "createdAt", "updatedAt", "discountPrice", "isDiscountable", "hoverThumbnailUrl", "thumbnailUrl") VALUES ('f8d6ce2c-9e76-4ce4-9da8-07c73926c2ee', 'dress 2', 'that is subtitle', 'dress-2', 'That is description ', 1999, '{https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773485292311.png,https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773485293463.png,https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773485293852.png,https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773485294300.png,https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773485294522.png,https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773485294666.png,https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773485295084.png}', 100, '2026-03-14 10:48:15.447', '2026-03-14 10:49:06.923', 500, true, 'https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773485294666.png', 'https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773485292311.png');
INSERT INTO public."Product" (id, name, subtitle, handle, description, price, images, stock, "createdAt", "updatedAt", "discountPrice", "isDiscountable", "hoverThumbnailUrl", "thumbnailUrl") VALUES ('6552ab7d-f3df-4fef-b317-826f1f25d198', 'dress 4', 'that is subtitle', 'dress-4', 'that is description', 149, '{https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773487951949.png,https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773487953110.png,https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773487953435.png}', 99, '2026-03-14 11:32:33.882', '2026-03-14 11:32:33.882', 50, true, 'https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773487953110.png', 'https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773487951949.png');
INSERT INTO public."Product" (id, name, subtitle, handle, description, price, images, stock, "createdAt", "updatedAt", "discountPrice", "isDiscountable", "hoverThumbnailUrl", "thumbnailUrl") VALUES ('03d20d5c-a9a5-4db6-816a-f95a84f78cd6', 'dress 5', ' subtitle h ye', 'dress-5', 'description h ye ', 799, '{https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773488109440.png,https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773488110393.png,https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773488111128.png,https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773488111628.png,https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773488111982.png,https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773488112338.png}', 299, '2026-03-14 11:35:12.666', '2026-03-16 05:47:16.946', 201, true, 'https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773488112338.png', 'https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773488110393.png');
INSERT INTO public."Product" (id, name, subtitle, handle, description, price, images, stock, "createdAt", "updatedAt", "discountPrice", "isDiscountable", "hoverThumbnailUrl", "thumbnailUrl") VALUES ('32b76078-3ffd-4b09-b741-657872fc9c71', 'dress 3', '', 'dress-3', 'that is descripiton ', 1999, '{https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773486368915.png,https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773486369937.png,https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773486370464.png,https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773486370758.png,https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773486371034.png,https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773486371285.png}', 200, '2026-03-14 11:06:11.606', '2026-03-16 06:27:39.64', 500, true, 'https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773486369937.png', 'https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773486371285.png');


--
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: ProductVariant; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."ProductVariant" (id, title, price, stock, images, "productId", "createdAt", "updatedAt", "hoverThumbnailUrl", "thumbnailUrl") VALUES ('11c73924-35c2-499b-962c-c7c4884c6854', 'color: yellow', 1899, 100, '{https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773486370464.png,https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773486369937.png,https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773486368915.png}', '32b76078-3ffd-4b09-b741-657872fc9c71', '2026-03-16 06:27:39.64', '2026-03-16 06:27:39.64', NULL, NULL);
INSERT INTO public."ProductVariant" (id, title, price, stock, images, "productId", "createdAt", "updatedAt", "hoverThumbnailUrl", "thumbnailUrl") VALUES ('60fb074d-3ab6-48d3-83d2-966ccaa04150', 'color: white', NULL, 100, '{https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773486371285.png,https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773486371034.png,https://yhqoiuriqyjywafcdjfh.supabase.co/storage/v1/object/public/ecommerce/product-1773486370758.png}', '32b76078-3ffd-4b09-b741-657872fc9c71', '2026-03-16 06:27:39.64', '2026-03-16 06:27:39.64', NULL, NULL);


--
-- Data for Name: Review; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: Sale; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: _CategoryToProduct; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."_CategoryToProduct" ("A", "B") VALUES ('dd1edd1c-f7fb-425c-95b8-9fbbd125bc85', '9682671f-8814-4cae-abc6-8abc0eace501');
INSERT INTO public."_CategoryToProduct" ("A", "B") VALUES ('69ef1249-77ca-4f55-b4ff-7fd041f60ef0', '6552ab7d-f3df-4fef-b317-826f1f25d198');
INSERT INTO public."_CategoryToProduct" ("A", "B") VALUES ('69ef1249-77ca-4f55-b4ff-7fd041f60ef0', '32b76078-3ffd-4b09-b741-657872fc9c71');


--
-- Data for Name: _CollectionToProduct; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."_CollectionToProduct" ("A", "B") VALUES ('cf96c991-3f77-4b05-a957-b160a926a56d', '9682671f-8814-4cae-abc6-8abc0eace501');
INSERT INTO public."_CollectionToProduct" ("A", "B") VALUES ('25a1dc7c-029e-44b9-b64b-e25e1525a4de', '6552ab7d-f3df-4fef-b317-826f1f25d198');


--
-- PostgreSQL database dump complete
--

\unrestrict ujm8oc3pGfAEFv5qHDY8sEfKF9SwHM2ZxbvCMZKNqOhjWWc9OjcDqIxZL1YC394

