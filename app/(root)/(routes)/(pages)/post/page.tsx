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

    <div className={"max-w-6xl mx-auto px-6 py-4"}>
        <PostForm selectedDate={selectedDate} role={role}/>
    </div>
  );
}
