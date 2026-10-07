/* =========================================================================
   VITTA - Cria bucket de demonstrações de exercícios
   Bucket privado para armazenar GIFs/vídeos curtos de execução.
   ========================================================================= */

INSERT INTO storage.buckets (id, name, public)
VALUES ('exercise-demonstrations', 'exercise-demonstrations', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso: cada usuário só acessa seus próprios arquivos
DROP POLICY IF EXISTS "demonstrations_select_own" ON storage.objects;
CREATE POLICY "demonstrations_select_own" ON storage.objects FOR SELECT
  USING (bucket_id = 'exercise-demonstrations' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "demonstrations_insert_own" ON storage.objects;
CREATE POLICY "demonstrations_insert_own" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'exercise-demonstrations' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "demonstrations_update_own" ON storage.objects;
CREATE POLICY "demonstrations_update_own" ON storage.objects FOR UPDATE
  USING (bucket_id = 'exercise-demonstrations' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "demonstrations_delete_own" ON storage.objects;
CREATE POLICY "demonstrations_delete_own" ON storage.objects FOR DELETE
  USING (bucket_id = 'exercise-demonstrations' AND (storage.foldername(name))[1] = auth.uid()::text);
