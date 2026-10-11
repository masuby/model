-- 0010: direct-edit submissions are validated against the model (issue DE-08).
--
-- submissions.unit_id and every change's ref were checked only by length and pattern, so an approved
-- edit for an unknown unit or a renamed indicator group vanished without a word (the engine ignores
-- what it cannot place). Two reference tables now carry the model's units and indicator groups, a
-- trigger refuses a submission that names anything else, and review_submission checks again.
--
-- Seeded from the model: TZ, the 31 regions (R-<key>), the 195 councils (C001..C195) and the 170
-- workbook units (TZ0101..); the 32 indicator groups of src/engine/risk/hierarchy.ts.
-- Apply to the live project after 0009.

create table if not exists public.units (
  id    text primary key,
  level text not null check (level in ('national', 'region', 'council', 'source')),
  name  text not null
);
create table if not exists public.indicator_groups (
  ref       text primary key check (ref ~ '^(hazard|vulnerability|coping):[A-Za-z]+$'),
  dimension text not null,
  category  text not null
);
alter table public.units enable row level security;
alter table public.indicator_groups enable row level security;
drop policy if exists "units: public read" on public.units;
create policy "units: public read" on public.units for select to anon, authenticated using (true);
drop policy if exists "indicator groups: public read" on public.indicator_groups;
create policy "indicator groups: public read" on public.indicator_groups for select to anon, authenticated using (true);
grant select on public.units, public.indicator_groups to anon, authenticated;

insert into public.units (id, level, name) values
  ('TZ', 'national', 'Tanzania'),
  ('R-arusha', 'region', 'Arusha'),
  ('R-daressalaam', 'region', 'Dar es Salaam'),
  ('R-dodoma', 'region', 'Dodoma'),
  ('R-geita', 'region', 'Geita'),
  ('R-iringa', 'region', 'Iringa'),
  ('R-kagera', 'region', 'Kagera'),
  ('R-kaskazinipemba', 'region', 'Kaskazini Pemba'),
  ('R-kaskaziniunguja', 'region', 'Kaskazini Unguja'),
  ('R-katavi', 'region', 'Katavi'),
  ('R-kigoma', 'region', 'Kigoma'),
  ('R-kilimanjaro', 'region', 'Kilimanjaro'),
  ('R-kusinipemba', 'region', 'Kusini Pemba'),
  ('R-kusiniunguja', 'region', 'Kusini Unguja'),
  ('R-lindi', 'region', 'Lindi'),
  ('R-manyara', 'region', 'Manyara'),
  ('R-mara', 'region', 'Mara'),
  ('R-mbeya', 'region', 'Mbeya'),
  ('R-mjinimagharibi', 'region', 'Mjini Magharibi'),
  ('R-morogoro', 'region', 'Morogoro'),
  ('R-mtwara', 'region', 'Mtwara'),
  ('R-mwanza', 'region', 'Mwanza'),
  ('R-njombe', 'region', 'Njombe'),
  ('R-pwani', 'region', 'Pwani'),
  ('R-rukwa', 'region', 'Rukwa'),
  ('R-ruvuma', 'region', 'Ruvuma'),
  ('R-shinyanga', 'region', 'Shinyanga'),
  ('R-simiyu', 'region', 'Simiyu'),
  ('R-singida', 'region', 'Singida'),
  ('R-songwe', 'region', 'Songwe'),
  ('R-tabora', 'region', 'Tabora'),
  ('R-tanga', 'region', 'Tanga'),
  ('C001', 'council', 'Kondoa District'),
  ('C002', 'council', 'Kondoa Town'),
  ('C003', 'council', 'Mpwapwa District'),
  ('C004', 'council', 'Kongwa District'),
  ('C005', 'council', 'Chamwino District'),
  ('C006', 'council', 'Dodoma City'),
  ('C007', 'council', 'Bahi District'),
  ('C008', 'council', 'Chemba District'),
  ('C009', 'council', 'Monduli District'),
  ('C010', 'council', 'Meru District'),
  ('C011', 'council', 'Arusha District'),
  ('C012', 'council', 'Longido District'),
  ('C013', 'council', 'Karatu District'),
  ('C014', 'council', 'Ngorongoro District'),
  ('C015', 'council', 'Arusha City'),
  ('C016', 'council', 'Rombo District'),
  ('C017', 'council', 'Mwanga District'),
  ('C018', 'council', 'Same District'),
  ('C019', 'council', 'Moshi Municipal'),
  ('C020', 'council', 'Moshi District'),
  ('C021', 'council', 'Hai District'),
  ('C022', 'council', 'Siha District'),
  ('C023', 'council', 'Lushoto District'),
  ('C024', 'council', 'Bumbuli District'),
  ('C025', 'council', 'Korogwe District'),
  ('C026', 'council', 'Korogwe Town'),
  ('C027', 'council', 'Muheza District'),
  ('C028', 'council', 'Tanga City'),
  ('C029', 'council', 'Pangani District'),
  ('C030', 'council', 'Handeni District'),
  ('C031', 'council', 'Handeni Town'),
  ('C032', 'council', 'Kilindi District'),
  ('C033', 'council', 'Mkinga District'),
  ('C034', 'council', 'Kilosa District'),
  ('C035', 'council', 'Morogoro District'),
  ('C036', 'council', 'Morogoro Municipal'),
  ('C037', 'council', 'Mlimba District'),
  ('C038', 'council', 'Ifakara Town'),
  ('C039', 'council', 'Ulanga District'),
  ('C040', 'council', 'Malinyi District'),
  ('C041', 'council', 'Mvomero District'),
  ('C042', 'council', 'Gairo District'),
  ('C043', 'council', 'Bagamoyo District'),
  ('C044', 'council', 'Chalinze District'),
  ('C045', 'council', 'Kibaha District'),
  ('C046', 'council', 'Kibaha Town'),
  ('C047', 'council', 'Kisarawe District'),
  ('C048', 'council', 'Mkuranga District'),
  ('C049', 'council', 'Rufiji District'),
  ('C050', 'council', 'Mafia District'),
  ('C051', 'council', 'Kibiti District'),
  ('C052', 'council', 'Kinondoni Municipal'),
  ('C053', 'council', 'Dar es Salaam City'),
  ('C054', 'council', 'Temeke Municipal'),
  ('C055', 'council', 'Kigamboni Municipal'),
  ('C056', 'council', 'Ubungo Municipal'),
  ('C057', 'council', 'Kilwa District'),
  ('C058', 'council', 'Mtama District'),
  ('C059', 'council', 'Lindi Municipal'),
  ('C060', 'council', 'Nachingwea District'),
  ('C061', 'council', 'Liwale District'),
  ('C062', 'council', 'Ruangwa District'),
  ('C063', 'council', 'Mtwara District'),
  ('C064', 'council', 'Nanyamba Town'),
  ('C065', 'council', 'Mtwara Mikindani Municipal'),
  ('C066', 'council', 'Newala District'),
  ('C067', 'council', 'Newala Town'),
  ('C068', 'council', 'Masasi District'),
  ('C069', 'council', 'Masasi Town'),
  ('C070', 'council', 'Tandahimba District'),
  ('C071', 'council', 'Nanyumbu District'),
  ('C072', 'council', 'Tunduru District'),
  ('C073', 'council', 'Songea District'),
  ('C074', 'council', 'Songea Municipal'),
  ('C075', 'council', 'Madaba District'),
  ('C076', 'council', 'Mbinga District'),
  ('C077', 'council', 'Mbinga Town'),
  ('C078', 'council', 'Nyasa District'),
  ('C079', 'council', 'Namtumbo District'),
  ('C080', 'council', 'Iringa District'),
  ('C081', 'council', 'Iringa Municipal'),
  ('C082', 'council', 'Mafinga Town'),
  ('C083', 'council', 'Mufindi District'),
  ('C084', 'council', 'Kilolo District'),
  ('C085', 'council', 'Chunya District'),
  ('C086', 'council', 'Mbeya District'),
  ('C087', 'council', 'Mbeya City'),
  ('C088', 'council', 'Kyela District'),
  ('C089', 'council', 'Rungwe District'),
  ('C090', 'council', 'Busokelo District'),
  ('C091', 'council', 'Mbarali District'),
  ('C092', 'council', 'Iramba District'),
  ('C093', 'council', 'Singida District'),
  ('C094', 'council', 'Singida Municipal'),
  ('C095', 'council', 'Manyoni District'),
  ('C096', 'council', 'Itigi District'),
  ('C097', 'council', 'Ikungi District'),
  ('C098', 'council', 'Mkalama District'),
  ('C099', 'council', 'Nzega Town'),
  ('C100', 'council', 'Nzega District'),
  ('C101', 'council', 'Igunga District'),
  ('C102', 'council', 'Uyui District'),
  ('C103', 'council', 'Urambo District'),
  ('C104', 'council', 'Sikonge District'),
  ('C105', 'council', 'Tabora Municipal'),
  ('C106', 'council', 'Kaliua District'),
  ('C107', 'council', 'Kalambo District'),
  ('C108', 'council', 'Sumbawanga District'),
  ('C109', 'council', 'Sumbawanga Municipal'),
  ('C110', 'council', 'Nkasi District'),
  ('C111', 'council', 'Kibondo District'),
  ('C112', 'council', 'Kasulu District'),
  ('C113', 'council', 'Kasulu Town'),
  ('C114', 'council', 'Kigoma District'),
  ('C115', 'council', 'Kigoma Ujiji Municipal'),
  ('C116', 'council', 'Uvinza District'),
  ('C117', 'council', 'Buhigwe District'),
  ('C118', 'council', 'Kakonko District'),
  ('C119', 'council', 'Ushetu District'),
  ('C120', 'council', 'Kahama Municipal'),
  ('C121', 'council', 'Msalala District'),
  ('C122', 'council', 'Kishapu District'),
  ('C123', 'council', 'Shinyanga District'),
  ('C124', 'council', 'Shinyanga Municipal'),
  ('C125', 'council', 'Karagwe District'),
  ('C126', 'council', 'Bukoba District'),
  ('C127', 'council', 'Bukoba Municipal'),
  ('C128', 'council', 'Muleba District'),
  ('C129', 'council', 'Biharamulo District'),
  ('C130', 'council', 'Ngara District'),
  ('C131', 'council', 'Kyerwa District'),
  ('C132', 'council', 'Missenyi District'),
  ('C133', 'council', 'Ukerewe District'),
  ('C134', 'council', 'Magu District'),
  ('C135', 'council', 'Mwanza City'),
  ('C136', 'council', 'Kwimba District'),
  ('C137', 'council', 'Sengerema District'),
  ('C138', 'council', 'Buchosa District'),
  ('C139', 'council', 'Ilemela Municipal'),
  ('C140', 'council', 'Misungwi District'),
  ('C141', 'council', 'Tarime District'),
  ('C142', 'council', 'Tarime Town'),
  ('C143', 'council', 'Serengeti District'),
  ('C144', 'council', 'Musoma District'),
  ('C145', 'council', 'Musoma Municipal'),
  ('C146', 'council', 'Bunda District'),
  ('C147', 'council', 'Bunda Town'),
  ('C148', 'council', 'Butiama District'),
  ('C149', 'council', 'Rorya District'),
  ('C150', 'council', 'Babati District'),
  ('C151', 'council', 'Babati Town'),
  ('C152', 'council', 'Hanang District'),
  ('C153', 'council', 'Mbulu District'),
  ('C154', 'council', 'Mbulu Town'),
  ('C155', 'council', 'Simanjiro District'),
  ('C156', 'council', 'Kiteto District'),
  ('C157', 'council', 'Njombe District'),
  ('C158', 'council', 'Njombe Town'),
  ('C159', 'council', 'Makambako Town'),
  ('C160', 'council', 'Ludewa District'),
  ('C161', 'council', 'Makete District'),
  ('C162', 'council', 'Wanging''ombe District'),
  ('C163', 'council', 'Mpanda Municipal'),
  ('C164', 'council', 'Nsimbo District'),
  ('C165', 'council', 'Tanganyika District'),
  ('C166', 'council', 'Mlele District'),
  ('C167', 'council', 'Mpimbwe District'),
  ('C168', 'council', 'Bariadi District'),
  ('C169', 'council', 'Bariadi Town'),
  ('C170', 'council', 'Itilima District'),
  ('C171', 'council', 'Meatu District'),
  ('C172', 'council', 'Maswa District'),
  ('C173', 'council', 'Busega District'),
  ('C174', 'council', 'Geita District'),
  ('C175', 'council', 'Geita Town'),
  ('C176', 'council', 'Nyang''hwale District'),
  ('C177', 'council', 'Mbogwe District'),
  ('C178', 'council', 'Bukombe District'),
  ('C179', 'council', 'Chato District'),
  ('C180', 'council', 'Momba District'),
  ('C181', 'council', 'Tunduma Town'),
  ('C182', 'council', 'Songwe District'),
  ('C183', 'council', 'Mbozi District'),
  ('C184', 'council', 'Ileje District'),
  ('C185', 'council', 'Kaskazini A Town'),
  ('C186', 'council', 'Kaskazini B Town'),
  ('C187', 'council', 'Kati Town'),
  ('C188', 'council', 'Kusini District'),
  ('C189', 'council', 'Mjini Municipal'),
  ('C190', 'council', 'Magharibi A Municipal'),
  ('C191', 'council', 'Magharibi B Municipal'),
  ('C192', 'council', 'Wete Town'),
  ('C193', 'council', 'Micheweni District'),
  ('C194', 'council', 'Chake Chake Town'),
  ('C195', 'council', 'Mkoani Town'),
  ('TZ0101', 'source', 'Kondoa'),
  ('TZ0102', 'source', 'Mpwapwa'),
  ('TZ0103', 'source', 'Kongwa'),
  ('TZ0104', 'source', 'Chamwino'),
  ('TZ0105', 'source', 'Dodoma Urban'),
  ('TZ0106', 'source', 'Bahi'),
  ('TZ0107', 'source', 'Chemba'),
  ('TZ0201', 'source', 'Monduli'),
  ('TZ0202', 'source', 'Meru'),
  ('TZ0203', 'source', 'Arusha Urban'),
  ('TZ0204', 'source', 'Karatu'),
  ('TZ0205', 'source', 'Ngorongoro'),
  ('TZ0206', 'source', 'Arusha'),
  ('TZ0207', 'source', 'Longido'),
  ('TZ0301', 'source', 'Rombo'),
  ('TZ0302', 'source', 'Mwanga'),
  ('TZ0303', 'source', 'Same'),
  ('TZ0304', 'source', 'Moshi'),
  ('TZ0305', 'source', 'Hai'),
  ('TZ0306', 'source', 'Moshi Urban'),
  ('TZ0307', 'source', 'Siha'),
  ('TZ0401', 'source', 'Lushoto'),
  ('TZ0402', 'source', 'Korogwe'),
  ('TZ0403', 'source', 'Muheza'),
  ('TZ0404', 'source', 'Tanga Urban'),
  ('TZ0405', 'source', 'Pangani'),
  ('TZ0406', 'source', 'Handeni'),
  ('TZ0407', 'source', 'Kilindi'),
  ('TZ0408', 'source', 'Mkinga'),
  ('TZ0409', 'source', 'Korogwe Township Authority'),
  ('TZ0410', 'source', 'Handeni Mji'),
  ('TZ0501', 'source', 'Kilosa'),
  ('TZ0502', 'source', 'Morogoro'),
  ('TZ0503', 'source', 'Kilombero'),
  ('TZ0504', 'source', 'Ulanga'),
  ('TZ0505', 'source', 'Morogoro Urban'),
  ('TZ0506', 'source', 'Mvomero'),
  ('TZ0507', 'source', 'Gairo'),
  ('TZ0601', 'source', 'Bagamoyo'),
  ('TZ0602', 'source', 'Kibaha'),
  ('TZ0603', 'source', 'Kisarawe'),
  ('TZ0604', 'source', 'Mkuranga'),
  ('TZ0605', 'source', 'Rufiji'),
  ('TZ0606', 'source', 'Mafia'),
  ('TZ0607', 'source', 'Kibaha Urban'),
  ('TZ0701', 'source', 'Kinondoni'),
  ('TZ0702', 'source', 'Ilala'),
  ('TZ0703', 'source', 'Temeke'),
  ('TZ0801', 'source', 'Kilwa'),
  ('TZ0802', 'source', 'Lindi'),
  ('TZ0803', 'source', 'Nachingwea'),
  ('TZ0804', 'source', 'Liwale'),
  ('TZ0805', 'source', 'Ruangwa'),
  ('TZ0806', 'source', 'Lindi Urban'),
  ('TZ0901', 'source', 'Mtwara'),
  ('TZ0902', 'source', 'Newala'),
  ('TZ0903', 'source', 'Masasi'),
  ('TZ0904', 'source', 'Tandahimba'),
  ('TZ0905', 'source', 'Mtwara Urban'),
  ('TZ0906', 'source', 'Nanyumbu'),
  ('TZ0907', 'source', 'Masasi  Township Authority'),
  ('TZ1001', 'source', 'Tunduru'),
  ('TZ1002', 'source', 'Songea'),
  ('TZ1003', 'source', 'Mbinga'),
  ('TZ1004', 'source', 'Songea Urban'),
  ('TZ1005', 'source', 'Namtumbo'),
  ('TZ1006', 'source', 'Nyasa'),
  ('TZ1101', 'source', 'Iringa'),
  ('TZ1102', 'source', 'Mufindi'),
  ('TZ1103', 'source', 'Iringa Urban'),
  ('TZ1104', 'source', 'Kilolo'),
  ('TZ1105', 'source', 'Mafinga Township Authority'),
  ('TZ1201', 'source', 'Chunya'),
  ('TZ1202', 'source', 'Mbeya'),
  ('TZ1203', 'source', 'Kyela'),
  ('TZ1204', 'source', 'Rungwe'),
  ('TZ1207', 'source', 'Mbarali'),
  ('TZ1208', 'source', 'Mbeya Urban'),
  ('TZ1301', 'source', 'Iramba'),
  ('TZ1302', 'source', 'Singida'),
  ('TZ1303', 'source', 'Manyoni'),
  ('TZ1304', 'source', 'Singida Urban'),
  ('TZ1305', 'source', 'Ikungi'),
  ('TZ1306', 'source', 'Mkalama'),
  ('TZ1401', 'source', 'Nzega'),
  ('TZ1402', 'source', 'Igunga'),
  ('TZ1403', 'source', 'Uyui'),
  ('TZ1404', 'source', 'Urambo'),
  ('TZ1405', 'source', 'Sikonge'),
  ('TZ1406', 'source', 'Tabora Urban'),
  ('TZ1407', 'source', 'Kaliua'),
  ('TZ1501', 'source', 'Kalambo'),
  ('TZ1502', 'source', 'Sumbawanga'),
  ('TZ1503', 'source', 'Nkasi'),
  ('TZ1504', 'source', 'Sumbawanga Urban'),
  ('TZ1601', 'source', 'Kibondo'),
  ('TZ1602', 'source', 'Kasulu'),
  ('TZ1603', 'source', 'Kigoma'),
  ('TZ1604', 'source', 'Kigoma  Urban'),
  ('TZ1605', 'source', 'Uvinza'),
  ('TZ1606', 'source', 'Buhigwe'),
  ('TZ1607', 'source', 'Kakonko'),
  ('TZ1608', 'source', 'Kasulu Township Authority'),
  ('TZ1701', 'source', 'Shinyanga Urban'),
  ('TZ1702', 'source', 'Kishapu'),
  ('TZ1703', 'source', 'Shinyanga'),
  ('TZ1704', 'source', 'Kahama'),
  ('TZ1705', 'source', 'Kahama Township Authority'),
  ('TZ1801', 'source', 'Karagwe'),
  ('TZ1802', 'source', 'Bukoba'),
  ('TZ1803', 'source', 'Muleba'),
  ('TZ1804', 'source', 'Biharamulo'),
  ('TZ1805', 'source', 'Ngara'),
  ('TZ1806', 'source', 'Bukoba Urban'),
  ('TZ1807', 'source', 'Missenyi'),
  ('TZ1808', 'source', 'Kyerwa'),
  ('TZ1901', 'source', 'Ukerewe'),
  ('TZ1902', 'source', 'Magu'),
  ('TZ1903', 'source', 'Nyamagana'),
  ('TZ1904', 'source', 'Kwimba'),
  ('TZ1905', 'source', 'Sengerema'),
  ('TZ1906', 'source', 'Ilemela'),
  ('TZ1907', 'source', 'Misungwi'),
  ('TZ2001', 'source', 'Tarime'),
  ('TZ2002', 'source', 'Serengeti'),
  ('TZ2003', 'source', 'Musoma'),
  ('TZ2004', 'source', 'Bunda'),
  ('TZ2005', 'source', 'Musoma Urban'),
  ('TZ2006', 'source', 'Rorya'),
  ('TZ2007', 'source', 'Butiama'),
  ('TZ2101', 'source', 'Babati'),
  ('TZ2102', 'source', 'Hanang'),
  ('TZ2103', 'source', 'Mbulu'),
  ('TZ2104', 'source', 'Simanjiro'),
  ('TZ2105', 'source', 'Kiteto'),
  ('TZ2106', 'source', 'Babati Urban'),
  ('TZ2201', 'source', 'Njombe Urban'),
  ('TZ2202', 'source', 'Wanging''ombe'),
  ('TZ2203', 'source', 'Makete'),
  ('TZ2204', 'source', 'Njombe'),
  ('TZ2205', 'source', 'Ludewa'),
  ('TZ2206', 'source', 'Makambako Township Authority'),
  ('TZ2301', 'source', 'Mpanda Urban'),
  ('TZ2302', 'source', 'Mpanda'),
  ('TZ2303', 'source', 'Mlele'),
  ('TZ2401', 'source', 'Bariadi'),
  ('TZ2402', 'source', 'Itilima'),
  ('TZ2403', 'source', 'Meatu'),
  ('TZ2404', 'source', 'Maswa'),
  ('TZ2405', 'source', 'Busega'),
  ('TZ2501', 'source', 'Geita'),
  ('TZ2502', 'source', 'Nyang''hwale'),
  ('TZ2503', 'source', 'Mbogwe'),
  ('TZ2504', 'source', 'Bukombe'),
  ('TZ2505', 'source', 'Chato'),
  ('TZ2601', 'source', 'Songwe'),
  ('TZ2605', 'source', 'Ileje'),
  ('TZ2606', 'source', 'Mbozi'),
  ('TZ2609', 'source', 'Momba'),
  ('TZ2610', 'source', 'Tunduma'),
  ('TZ5101', 'source', 'Kaskazini A'),
  ('TZ5102', 'source', 'Kaskazini B'),
  ('TZ5201', 'source', 'Kati'),
  ('TZ5202', 'source', 'Kusini'),
  ('TZ5301', 'source', 'Magharibi'),
  ('TZ5302', 'source', 'Mjini'),
  ('TZ5401', 'source', 'Wete'),
  ('TZ5402', 'source', 'Micheweni'),
  ('TZ5501', 'source', 'Chake Chake'),
  ('TZ5502', 'source', 'Mkoani')
on conflict (id) do update set level = excluded.level, name = excluded.name;

insert into public.indicator_groups (ref, dimension, category) values
  ('hazard:coastalHazards', 'hazard', 'natural'),
  ('hazard:drought', 'hazard', 'natural'),
  ('hazard:earthquake', 'hazard', 'natural'),
  ('hazard:environmentalDegradation', 'hazard', 'natural'),
  ('hazard:flood', 'hazard', 'natural'),
  ('hazard:heatwave', 'hazard', 'natural'),
  ('hazard:landslide', 'hazard', 'natural'),
  ('hazard:lightning', 'hazard', 'natural'),
  ('hazard:stormsCyclone', 'hazard', 'natural'),
  ('hazard:volcano', 'hazard', 'natural'),
  ('hazard:wildfire', 'hazard', 'natural'),
  ('hazard:zoonoses', 'hazard', 'natural'),
  ('hazard:conflictIntensity', 'hazard', 'human'),
  ('hazard:conflictRisk', 'hazard', 'human'),
  ('hazard:hazardousMaterial', 'hazard', 'human'),
  ('hazard:internalViolence', 'hazard', 'human'),
  ('hazard:vehicleAccidents', 'hazard', 'human'),
  ('vulnerability:developmentPoverty', 'vulnerability', 'socioEconomic'),
  ('vulnerability:economicDependency', 'vulnerability', 'socioEconomic'),
  ('vulnerability:habitat', 'vulnerability', 'socioEconomic'),
  ('vulnerability:livelihoods', 'vulnerability', 'socioEconomic'),
  ('vulnerability:displacedPeople', 'vulnerability', 'vulnerableGroups'),
  ('vulnerability:healthConditions', 'vulnerability', 'vulnerableGroups'),
  ('vulnerability:childrenHealthNutrition', 'vulnerability', 'vulnerableGroups'),
  ('vulnerability:economic', 'vulnerability', 'vulnerableGroups'),
  ('coping:accessHealth', 'coping', 'infrastructure'),
  ('coping:economicCapacity', 'coping', 'infrastructure'),
  ('coping:wash', 'coping', 'infrastructure'),
  ('coping:communication', 'coping', 'infrastructure'),
  ('coping:education', 'coping', 'infrastructure'),
  ('coping:drrImplementation', 'coping', 'institutional'),
  ('coping:governance', 'coping', 'institutional')
on conflict (ref) do update set dimension = excluded.dimension, category = excluded.category;

-- Validation shared by the insert trigger and the review function.
create or replace function app.validate_submission(p_unit_id text, p_changes jsonb)
returns void
language plpgsql stable set search_path = public
as $$
declare
  c   jsonb;
  lvl text;
begin
  select level into lvl from public.units where id = p_unit_id;
  if lvl is null then
    raise exception 'Unknown unit %', p_unit_id using errcode = '22023';
  end if;
  if lvl not in ('council', 'source') then
    raise exception 'Direct scores are entered for a council or a workbook unit, not %', p_unit_id using errcode = '22023';
  end if;
  for c in select * from jsonb_array_elements(p_changes) loop
    if not exists (select 1 from public.indicator_groups g where g.ref = c ->> 'ref') then
      raise exception 'Unknown indicator group %', c ->> 'ref' using errcode = '22023';
    end if;
    if c -> 'value' is not null and jsonb_typeof(c -> 'value') not in ('number', 'null') then
      raise exception 'Invalid value for %', c ->> 'ref' using errcode = '22023';
    end if;
    if jsonb_typeof(c -> 'value') = 'number' and ((c ->> 'value')::numeric < 0 or (c ->> 'value')::numeric > 10) then
      raise exception 'Scores must lie between 0 and 10 (%)', c ->> 'ref' using errcode = '22023';
    end if;
  end loop;
end $$;

create or replace function app.submissions_validate()
returns trigger
language plpgsql set search_path = public
as $$
begin
  perform app.validate_submission(new.unit_id, new.changes);
  return new;
end $$;

drop trigger if exists submissions_validate on public.submissions;
create trigger submissions_validate before insert on public.submissions
  for each row execute function app.submissions_validate();

-- review_submission as in 0002, with the validation before anything is written.
create or replace function public.review_submission(p_id uuid, p_decision text, p_note text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  s        public.submissions;
  c        jsonb;
  reviewer text;
begin
  if not app.is_reviewer() then
    raise exception 'Only PMO reviewers or administrators can review submissions' using errcode = '42501';
  end if;
  if p_decision not in ('approved', 'rejected') then
    raise exception 'Invalid decision %', p_decision;
  end if;

  select * into s from public.submissions where id = p_id for update;
  if not found then raise exception 'Submission not found'; end if;
  if s.status <> 'pending' then raise exception 'Submission already reviewed'; end if;

  select coalesce(nullif(full_name, ''), 'Reviewer') into reviewer from public.profiles where id = auth.uid();

  if p_decision = 'approved' then
    perform app.validate_submission(s.unit_id, s.changes);
    for c in select * from jsonb_array_elements(s.changes) loop
      insert into public.indicator_values (unit_id, ref, value, authority, dataset, note, submission_id, author_name, updated_by, updated_at)
      values (
        s.unit_id,
        c ->> 'ref',
        case when c -> 'value' is null or jsonb_typeof(c -> 'value') = 'null' then null else round((c ->> 'value')::numeric, 1) end,
        s.authority, s.dataset, s.note, s.id,
        s.author_name || case when s.author_id <> auth.uid() then ' · approved by ' || reviewer else '' end,
        auth.uid(), now()
      )
      on conflict (unit_id, ref) do update set
        value = excluded.value, authority = excluded.authority, dataset = excluded.dataset, note = excluded.note,
        submission_id = excluded.submission_id, author_name = excluded.author_name,
        updated_by = excluded.updated_by, updated_at = excluded.updated_at;
    end loop;
  end if;

  update public.submissions
     set status = p_decision, reviewed_at = now(), reviewer_id = auth.uid(), reviewer_name = reviewer, review_note = p_note
   where id = p_id;

  insert into public.audit_log (actor_id, actor_name, action, unit_id, unit_name, detail)
  values (auth.uid(), reviewer, p_decision, s.unit_id, s.unit_name, p_note);
end $$;
