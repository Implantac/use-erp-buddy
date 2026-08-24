ALTER TABLE public.job_candidates DROP CONSTRAINT IF EXISTS job_candidates_status_check;
ALTER TABLE public.job_candidates ADD CONSTRAINT job_candidates_status_check
  CHECK (status = ANY (ARRAY['applied','screening','reviewing','interview','interviewing','offer','hired','rejected']));