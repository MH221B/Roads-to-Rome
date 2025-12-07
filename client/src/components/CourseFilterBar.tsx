import { FaSearch } from 'react-icons/fa';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CourseFilterBar() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="mb-6 flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
        <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
          <Select defaultValue="recent-accessed">
            <SelectTrigger className="w-48 font-bold">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent-accessed">Recently Accessed</SelectItem>
              <SelectItem value="recent-enrolled">Recently Enrolled</SelectItem>
              <SelectItem value="a-z">Title: A-to-Z</SelectItem>
              <SelectItem value="z-a">Title: Z-to-A</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="w-36 font-bold">
              <SelectValue placeholder="Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dev">Development</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="w-36 font-bold">
              <SelectValue placeholder="Progress" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not-started">Not Started</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="w-36 font-bold">
              <SelectValue placeholder="Instructor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="john">John Doe</SelectItem>
              <SelectItem value="jane">Jane Smith</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground px-2 font-bold hover:bg-transparent"
            onClick={() => {
              /* Reset filters placeholder: implement filter reset logic if needed */
            }}
          >
            Reset
          </Button>
        </div>

        <div className="flex w-full items-center md:w-auto">
          <div className="flex w-full max-w-sm items-center space-x-0">
            <Input
              type="text"
              placeholder="Search my courses"
              className="w-full rounded-r-none border-r-0 focus-visible:ring-0 focus-visible:ring-offset-0 md:w-64"
            />
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-l-none px-4">
              <FaSearch className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
