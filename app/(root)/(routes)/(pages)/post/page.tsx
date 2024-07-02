// PostPageServer.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { useHandleFileUpload } from '@/hooks/use-handle-file-upload'
import PostForm from '@/app/(root)/(routes)/(pages)/post/_components/post-form'
import { getSession } from 'next-auth/react'

export default async function PostPageServer() {
  const role = await auth();

  if (!role) {
    redirect('/login');
  }

  const selectedDate = null;

  console.log(role)
  return (

        <PostForm selectedDate={selectedDate} role={role}/>
  );
}
